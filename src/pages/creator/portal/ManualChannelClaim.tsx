import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Empty, Form, Input, Modal, Radio, Select, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { claimService, type ClaimChannel } from '../../../services/api/claimService';
import { getErrorMessage } from '../../../services/apiClient';
import type { CooperationTarget } from '../../../services/cooperationContinuation';

export function httpUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch {
    return undefined;
  }
}

const platforms = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE'];

interface Props {
  initialPlatform?: string;
  initialQuery?: string;
  invitation?: { token: string; target: CooperationTarget };
  onClose: () => void;
  onSubmitted: () => void;
}

interface Evidence {
  evidenceUrls: string[];
  note: string;
}

export default function ManualChannelClaim({ initialPlatform, initialQuery, invitation, onClose, onSubmitted }: Props) {
  const [platform, setPlatform] = useState(initialPlatform ?? 'FACEBOOK');
  const [query, setQuery] = useState(initialQuery ?? '');
  const [results, setResults] = useState<ClaimChannel[] | null>(null);
  const [selected, setSelected] = useState<string>();
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const lookup = useRef<AbortController | null>(null);
  const saving = useRef(false);
  const creatorId = invitation?.target.creatorId ?? selected;
  useEffect(() => () => lookup.current?.abort(), []);

  function resetSearch() {
    lookup.current?.abort();
    setLookingUp(false);
    setResults(null);
    setSelected(undefined);
    setError('');
  }

  async function findChannel(value: string) {
    resetSearch();
    if (!value.trim()) {
      setError('Nhập tên người dùng hoặc mã kênh để tra cứu.');
      return;
    }
    const controller = new AbortController();
    lookup.current = controller;
    setLookingUp(true);
    try {
      const items = await claimService.lookupChannels(platform, value.trim(), controller.signal);
      if (!controller.signal.aborted) setResults(items);
    } catch (cause) {
      if (!controller.signal.aborted) setError(getErrorMessage(cause, 'Không tra cứu được kênh.'));
    } finally {
      if (!controller.signal.aborted) setLookingUp(false);
    }
  }

  async function submit(values: Evidence) {
    if (!creatorId || saving.current) return;
    saving.current = true;
    setSubmitting(true);
    setError('');
    try {
      const claim = await claimService.submitClaim(creatorId, {
        evidenceUrls: values.evidenceUrls.map(url => url.trim()),
        note: values.note.trim(),
        cooperationInvitationToken: invitation?.token,
      });
      if (claim.status !== 'PENDING') throw new Error('Chưa xác nhận được yêu cầu chờ duyệt.');
      onSubmitted();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Không gửi được bằng chứng.'));
    } finally {
      saving.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Gửi bằng chứng thủ công" open onCancel={onClose} footer={null}
      closable={!submitting} mask={{ closable: !submitting }} keyboard={!submitting}>
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        {error && <Alert showIcon type="error" title={error} />}
        {invitation ? <Alert type="info" showIcon title="Kênh trong lời mời"
          description={`${invitation.target.platform} · ${invitation.target.username || invitation.target.creatorId}`} />
        : <>
        <Select aria-label="Nền tảng" value={platform} disabled={submitting}
          style={{ width: '100%' }} options={platforms.map(value => ({ value, label: value }))}
          onChange={value => { setPlatform(value); resetSearch(); }} />
        <Input.Search aria-label="Tên người dùng hoặc mã kênh" placeholder="Tên người dùng hoặc mã kênh"
          enterButton="Tra cứu" maxLength={255} loading={lookingUp} disabled={submitting}
          value={query} onChange={event => { setQuery(event.target.value); resetSearch(); }} onSearch={findChannel} />
        {results?.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không tìm thấy kênh có thể gửi yêu cầu. Kiểm tra lại tên người dùng hoặc mã kênh." />}
        {!!results?.length && (
          <Radio.Group name="claim-channel" aria-label="Chọn kênh để gửi bằng chứng" value={selected}
            disabled={submitting} onChange={event => setSelected(event.target.value)}>
            <Space orientation="vertical">
              {results.map(channel => {
                const profile = httpUrl(channel.profileUrl);
                return <Radio key={channel.id} value={channel.id}>
                  {channel.displayName || channel.userName} · {channel.userName} · {channel.externalId}
                  {profile && <> · <a href={profile} target="_blank" rel="noreferrer">Mở kênh</a></>}
                </Radio>;
              })}
            </Space>
          </Radio.Group>
        )}
        </>}
        <Form<Evidence> layout="vertical" disabled={submitting} initialValues={{ evidenceUrls: [''] }}
          onFinish={submit}>
          <Form.List name="evidenceUrls">
            {(fields, { add, remove }) => (
              <>
                {fields.map(field => (
                  <Form.Item key={field.key} label={'Liên kết bằng chứng ' + (field.name + 1)} required>
                    <Space.Compact block>
                      <Form.Item name={field.name} noStyle rules={[{
                        validator: (_, value?: string) => value && value.trim().length <= 1000 && httpUrl(value.trim())
                          ? Promise.resolve() : Promise.reject(new Error('Nhập liên kết HTTP hoặc HTTPS hợp lệ.')),
                      }]}>
                        <Input placeholder="https://..." maxLength={1000} />
                      </Form.Item>
                      {fields.length > 1 && <Button aria-label="Bỏ liên kết bằng chứng"
                        icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />}
                    </Space.Compact>
                  </Form.Item>
                ))}
                {fields.length < 5 && <Button icon={<PlusOutlined />} onClick={() => add('')}>
                  Thêm liên kết
                </Button>}
              </>
            )}
          </Form.List>
          <Form.Item name="note" label="Ghi chú" style={{ marginTop: 16 }}
            rules={[{ required: true, whitespace: true, message: 'Nhập ghi chú về quyền quản lý kênh.' }]}>
            <Input.TextArea rows={3} maxLength={2000} showCount
              placeholder="Ví dụ: Liên kết này dẫn đến ảnh phần cài đặt hiển thị quyền quản lý kênh của tôi." />
          </Form.Item>
          <Space wrap>
            <Button onClick={onClose}>Đóng</Button>
            <Button type="primary" htmlType="submit" disabled={!creatorId} loading={submitting}>
              Gửi bằng chứng
            </Button>
          </Space>
        </Form>
      </Space>
    </Modal>
  );
}
