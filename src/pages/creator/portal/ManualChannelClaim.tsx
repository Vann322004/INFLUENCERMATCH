import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Empty, Form, Input, Modal, Radio, Select, Space } from 'antd';
import { LinkOutlined, MinusCircleOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { claimService, type ClaimChannel } from '../../../services/api/claimService';
import { getErrorMessage } from '../../../services/apiClient';
import type { CooperationTarget } from '../../../services/cooperationContinuation';
import './CreatorPortalPage.css';

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
    <Modal
      open
      centered
      width={580}
      className="manual-claim-modal"
      onCancel={onClose}
      footer={null}
      closable={!submitting}
      mask={{ closable: !submitting }}
      keyboard={!submitting}
      title={
        <div className="manual-claim-modal-header">
          <div className="manual-claim-modal-icon">
            <SafetyCertificateOutlined />
          </div>
          <div>
            <div className="manual-claim-modal-title">Gửi bằng chứng thủ công</div>
            <div className="manual-claim-modal-subtitle">
              Tìm kênh và đính kèm liên kết xác minh để Data Manager phê duyệt
            </div>
          </div>
        </div>
      }
    >
      <div className="manual-claim-body">
        {error && <Alert showIcon type="error" title={error} />}

        <div className="manual-claim-section">
          <div className="manual-claim-step-header">
            <span className="manual-claim-step-badge">1</span>
            <span>Chọn nền tảng &amp; tra cứu kênh</span>
          </div>

          {invitation ? (
            <div className="manual-claim-invite-box">
              <div className="manual-claim-invite-label">Kênh trong lời mời hợp tác</div>
              <div className="manual-claim-invite-value">
                {invitation.target.platform} · {invitation.target.username || invitation.target.creatorId}
              </div>
            </div>
          ) : (
            <div className="manual-claim-lookup-stack">
              <div className="manual-claim-lookup-grid">
                <div>
                  <label className="manual-claim-field-label">Nền tảng</label>
                  <Select
                    aria-label="Nền tảng"
                    value={platform}
                    disabled={submitting}
                    style={{ width: '100%' }}
                    options={platforms.map(value => ({ value, label: value }))}
                    onChange={value => { setPlatform(value); resetSearch(); }}
                  />
                </div>
                <div>
                  <label className="manual-claim-field-label">Tên người dùng hoặc mã kênh</label>
                  <Input.Search
                    aria-label="Tên người dùng hoặc mã kênh"
                    placeholder="Ví dụ: @username hoặc ID kênh"
                    enterButton="Tra cứu"
                    maxLength={255}
                    loading={lookingUp}
                    disabled={submitting}
                    value={query}
                    onChange={event => { setQuery(event.target.value); resetSearch(); }}
                    onSearch={findChannel}
                  />
                </div>
              </div>

              {results?.length === 0 && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không tìm thấy kênh có thể gửi yêu cầu. Kiểm tra lại tên người dùng hoặc mã kênh."
                />
              )}

              {!!results?.length && (
                <Radio.Group
                  name="claim-channel"
                  aria-label="Chọn kênh để gửi bằng chứng"
                  value={selected}
                  disabled={submitting}
                  style={{ width: '100%' }}
                  onChange={event => setSelected(event.target.value)}
                >
                  <div className="manual-claim-results-list">
                    {results.map(channel => {
                      const profile = httpUrl(channel.profileUrl);
                      const isSelected = selected === channel.id;
                      return (
                        <label
                          key={channel.id}
                          className={`manual-claim-channel-card${isSelected ? ' is-selected' : ''}`}
                        >
                          <Radio value={channel.id}>
                            <span className="manual-claim-channel-name">
                              {channel.displayName || channel.userName}
                            </span>
                            <span className="manual-claim-channel-meta">
                              @{channel.userName} · {channel.externalId}
                            </span>
                          </Radio>
                          {profile && (
                            <a
                              className="manual-claim-channel-link"
                              href={profile}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Mở kênh
                            </a>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </Radio.Group>
              )}
            </div>
          )}
        </div>

        <Form<Evidence>
          layout="vertical"
          disabled={submitting}
          initialValues={{ evidenceUrls: [''] }}
          onFinish={submit}
          className="manual-claim-form"
        >
          <div className="manual-claim-section manual-claim-section--white">
            <div className="manual-claim-step-header">
              <span className="manual-claim-step-badge">2</span>
              <span>Bằng chứng quyền sở hữu</span>
            </div>

            <Form.List name="evidenceUrls">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <Form.Item
                      key={field.key}
                      label={`Liên kết bằng chứng ${field.name + 1}`}
                      required
                      style={{ marginBottom: 12 }}
                    >
                      <Space.Compact block>
                        <Form.Item
                          name={field.name}
                          noStyle
                          rules={[{
                            validator: (_, value?: string) => value && value.trim().length <= 1000 && httpUrl(value.trim())
                              ? Promise.resolve() : Promise.reject(new Error('Nhập liên kết HTTP hoặc HTTPS hợp lệ.')),
                          }]}
                        >
                          <Input
                            prefix={<LinkOutlined style={{ color: '#64748B' }} />}
                            placeholder="https://drive.google.com/... hoặc ảnh chụp màn hình"
                            maxLength={1000}
                          />
                        </Form.Item>
                        {fields.length > 1 && (
                          <Button
                            aria-label="Bỏ liên kết bằng chứng"
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        )}
                      </Space.Compact>
                    </Form.Item>
                  ))}
                  {fields.length < 5 && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add('')}
                      className="manual-claim-add-link-btn"
                    >
                      Thêm liên kết bằng chứng
                    </Button>
                  )}
                </>
              )}
            </Form.List>

            <Form.Item
              name="note"
              label="Ghi chú xác minh"
              style={{ marginTop: 12, marginBottom: 0 }}
              rules={[{ required: true, whitespace: true, message: 'Nhập ghi chú về quyền quản lý kênh.' }]}
            >
              <Input.TextArea
                rows={2}
                maxLength={2000}
                showCount
                placeholder="Ví dụ: Liên kết này dẫn đến ảnh phần cài đặt hiển thị quyền quản lý kênh của tôi."
              />
            </Form.Item>
          </div>

          <div className="manual-claim-footer">
            <Button onClick={onClose} className="manual-claim-cancel-btn">
              Đóng
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              disabled={!creatorId}
              loading={submitting}
              className="manual-claim-submit-btn"
            >
              Gửi bằng chứng
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
