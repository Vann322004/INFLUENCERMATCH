import { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Empty, Form, Grid, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { nicheService, type Niche, type NicheInput } from '../../../../services/api/nicheService';

function errorText(error: any): string {
  if (error?.response?.status === 401) return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản manager.';
  if (error?.response?.status === 403) return 'Tài khoản chưa được cấp quyền quản lý danh mục ngành hàng.';
  return error?.response?.data?.detail || error?.response?.data?.message || 'Không thể cập nhật ngành hàng. Vui lòng thử lại.';
}

export default function NicheManagementPanel() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [items, setItems] = useState<Niche[]>(() => nicheService.list.peek()?.value ?? []);
  const [loading, setLoading] = useState(() => !nicheService.list.peek());
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Niche | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form] = Form.useForm<NicheInput>();

  const load = async () => {
    nicheService.list.invalidate();
    setLoading(true);
    setError('');
    try { setItems(await nicheService.list()); }
    catch (err) { setError(errorText(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    nicheService.list()
      .then(rows => { if (active) setItems(rows); })
      .catch(err => { if (active) setError(errorText(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const showEditor = (item: Niche | null) => {
    setEditing(item);
    form.setFieldsValue(item ? { ...item, keywords: item.keywords || [] } : { name: '', description: '', active: true, keywords: [] });
    setOpen(true);
  };
  const save = async (values: NicheInput) => {
    setSaving(true);
    const input = { ...values, name: values.name.trim(), description: values.description?.trim() || '', keywords: [...new Set((values.keywords || []).map(word => word.trim().replace(/^#+/, '').trim()).filter(Boolean))] };
    if (!input.keywords.length) {
      setSaving(false);
      message.warning('Nhập ít nhất một từ khóa cho ngành hàng.');
      return;
    }
    try {
      const saved = editing ? await nicheService.update(editing.id, input) : await nicheService.create(input);
      setItems(prev => editing ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved]);
      setOpen(false);
      message.success(editing ? 'Đã cập nhật ngành hàng.' : 'Đã thêm ngành hàng.');
    } catch (err) { message.error(errorText(err)); }
    finally { setSaving(false); }
  };
  const remove = async (item: Niche) => {
    setDeletingId(item.id);
    try {
      await nicheService.remove(item.id);
      setItems(prev => prev.filter(row => row.id !== item.id));
      message.success('Đã xóa ngành hàng khỏi danh mục.');
    } catch (err) { message.error(errorText(err)); }
    finally { setDeletingId(null); }
  };

  const search = query.trim().toLocaleLowerCase('vi-VN');
  const filteredItems = items.filter(item => `${item.name} ${item.description || ''}`.toLocaleLowerCase('vi-VN').includes(search));

  return (
    <div style={{ color: '#0f172a', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 22, lineHeight: 1.35 }}>Quản lý lĩnh vực</div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
            Thiết lập danh mục ngành hàng và bộ từ khóa gợi ý phục vụ tìm kiếm, phân loại và Khám phá Nhà sáng tạo tự động.
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showEditor(null)}
          style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8, fontWeight: 600 }}
        >
          Thêm ngành hàng
        </Button>
      </div>

      {error && <Alert type="error" showIcon style={{ marginBottom: 16 }} title="Không tải được danh mục ngành hàng" description={error} action={<Button onClick={load}>Thử lại</Button>} />}

      <Card
        variant="borderless"
        style={{ borderRadius: 14, border: '1px solid #e1e7f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 18,
            padding: '14px 16px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
          }}
        >
          <Input.Search
            allowClear
            placeholder="Tìm tên hoặc mô tả ngành hàng"
            value={query}
            onChange={event => setQuery(event.target.value)}
            style={{ width: isMobile ? '100%' : 380 }}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load} style={{ borderRadius: 8, fontWeight: 600 }}>
            Làm mới
          </Button>
        </div>

        {isMobile ? (
          filteredItems.length === 0 ? (
            <Empty description={error ? 'Danh mục chưa tải được' : search ? 'Không tìm thấy ngành hàng phù hợp' : 'Chưa có ngành hàng. Hãy thêm ngành hàng đầu tiên.'} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredItems.map(item => (
                <div key={item.id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, background: '#FAF8FF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <strong style={{ fontSize: 14, color: '#0F172A', wordBreak: 'break-word' }}>{item.name}</strong>
                    <Tag color={item.active ? 'green' : 'default'} style={{ marginInlineEnd: 0, flexShrink: 0 }}>
                      {item.active ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                    </Tag>
                  </div>
                  {item.description && (
                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 8, lineHeight: 1.5 }}>{item.description}</div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {(item.keywords || []).map(keyword => (
                      <Tag key={keyword} color="purple" style={{ marginInlineEnd: 0, borderRadius: 6 }}>#{keyword}</Tag>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #EDE9FE' }}>
                    <Button size="small" onClick={() => showEditor(item)}>Sửa</Button>
                    <Popconfirm title={`Xóa ngành hàng “${item.name}”?`} description="Hồ sơ và dữ liệu đã lưu vẫn được giữ nguyên." okText="Xóa" cancelText="Hủy" onConfirm={() => remove(item)}>
                      <Button size="small" danger loading={deletingId === item.id} disabled={deletingId !== null}>Xóa</Button>
                    </Popconfirm>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <Table<Niche>
            rowKey="id"
            loading={loading}
            dataSource={filteredItems}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            size="middle"
            columns={[
              {
                title: 'Tên ngành hàng',
                dataIndex: 'name',
                width: 180,
                sorter: (a, b) => a.name.localeCompare(b.name, 'vi'),
                render: name => <strong style={{ color: '#0F172A' }}>{name}</strong>,
              },
              {
                title: 'Mô tả',
                dataIndex: 'description',
                render: description => <span style={{ color: '#475569', fontSize: 13 }}>{description || '—'}</span>,
              },
              {
                title: 'Từ khóa gợi ý',
                dataIndex: 'keywords',
                render: (keywords: string[] = []) => (
                  <Space size={[4, 4]} wrap>
                    {keywords.map(keyword => <Tag key={keyword} color="purple" style={{ marginInlineEnd: 0, borderRadius: 6 }}>#{keyword}</Tag>)}
                  </Space>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'active',
                width: 130,
                render: active => <Tag color={active ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>{active ? 'Đang sử dụng' : 'Ngừng sử dụng'}</Tag>,
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: 130,
                align: 'right',
                render: (_, item) => (
                  <Space size={6}>
                    <Button size="small" onClick={() => showEditor(item)}>Sửa</Button>
                    <Popconfirm title={`Xóa ngành hàng “${item.name}”?`} description="Hồ sơ và dữ liệu đã lưu vẫn được giữ nguyên." okText="Xóa" cancelText="Hủy" onConfirm={() => remove(item)}>
                      <Button size="small" danger loading={deletingId === item.id} disabled={deletingId !== null}>Xóa</Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            locale={{ emptyText: error ? 'Danh mục chưa tải được' : search ? 'Không tìm thấy ngành hàng phù hợp' : 'Chưa có ngành hàng. Hãy thêm ngành hàng đầu tiên.' }}
          />
        )}
      </Card>

      <Modal
        centered
        width={540}
        title={<span style={{ fontWeight: 700, fontSize: 16 }}>{editing ? 'Sửa ngành hàng' : 'Thêm ngành hàng'}</span>}
        open={open}
        onCancel={() => { if (!saving) setOpen(false); }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Lưu ngành hàng"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 600 } }}
        closable={!saving}
        maskClosable={!saving}
        cancelButtonProps={{ disabled: saving }}
      >
        <Form form={form} layout="vertical" onFinish={save} style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="Tên ngành hàng"
            style={{ marginBottom: 12 }}
            rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên ngành hàng.' }, { max: 100, message: 'Tên ngành hàng tối đa 100 ký tự.' }]}
          >
            <Input maxLength={100} placeholder="Ví dụ: Làm đẹp và mỹ phẩm" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            style={{ marginBottom: 12 }}
            rules={[{ max: 500, message: 'Mô tả tối đa 500 ký tự.' }]}
          >
            <Input.TextArea rows={2} maxLength={500} showCount style={{ resize: 'none' }} />
          </Form.Item>
          <Form.Item
            name="keywords"
            label="Từ khóa & hashtag gợi ý"
            style={{ marginBottom: 12 }}
            extra={<span style={{ fontSize: 12 }}>Nhập từ khóa rồi nhấn Enter hoặc dấu phẩy (,).</span>}
            rules={[
              { required: true, type: 'array', min: 1, message: 'Nhập ít nhất một từ khóa.' },
              { type: 'array', max: 30, message: 'Tối đa 30 từ khóa.' },
              { validator: (_, values: string[] = []) => values.some(value => value.trim().replace(/^#+/, '').trim().length === 0 || value.length > 100) ? Promise.reject(new Error('Mỗi từ khóa phải có nội dung và tối đa 100 ký tự.')) : Promise.resolve() },
            ]}
          >
            <Select mode="tags" open={false} placeholder="Ví dụ: review mỹ phẩm, skincare review" tokenSeparators={[',']} />
          </Form.Item>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
              Hiển thị trong Khám phá Nhà sáng tạo tự động
            </span>
            <Form.Item name="active" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
