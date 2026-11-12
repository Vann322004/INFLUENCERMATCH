import { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { nicheService, type Niche, type NicheInput } from '../../../../services/api/nicheService';

function errorText(error: any): string {
  return error?.response?.data?.detail || error?.response?.data?.message || 'Không thể cập nhật ngành hàng. Vui lòng thử lại.';
}

export default function NicheManagementPanel() {
  const { message } = App.useApp();
  const [items, setItems] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Niche | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form] = Form.useForm<NicheInput>();

  const load = async () => {
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
    form.setFieldsValue(item || { name: '', description: '', active: true });
    setOpen(true);
  };
  const save = async (values: NicheInput) => {
    setSaving(true);
    const input = { ...values, name: values.name.trim(), description: values.description?.trim() || '' };
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
  return (
    <>
      <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Typography.Title level={4} style={{ margin: '0 0 4px' }}>Quản lý ngành hàng</Typography.Title>
            <Typography.Text type="secondary">Quản lý danh mục ngành hàng và trạng thái sử dụng trong hệ thống.</Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showEditor(null)}>Thêm ngành hàng</Button>
        </div>
        {error && <Alert type="error" showIcon title="Không tải được danh mục ngành hàng" description={error} action={<Button onClick={load}>Thử lại</Button>} />}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <Input.Search allowClear placeholder="Tìm tên hoặc mô tả ngành hàng" value={query} onChange={event => setQuery(event.target.value)} style={{ maxWidth: 420 }} />
            <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>Làm mới</Button>
          </div>
          <Table<Niche>
            rowKey="id"
            loading={loading}
            dataSource={items.filter(item => `${item.name} ${item.description || ''}`.toLocaleLowerCase('vi-VN').includes(search))}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            scroll={{ x: 650 }}
            columns={[
              { title: 'Tên ngành hàng', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name, 'vi'), render: name => <strong>{name}</strong> },
              { title: 'Mô tả', dataIndex: 'description', render: description => description || '—' },
              { title: 'Trạng thái', dataIndex: 'active', render: active => <Tag color={active ? 'green' : 'default'}>{active ? 'Đang sử dụng' : 'Ngừng sử dụng'}</Tag> },
              { title: 'Thao tác', key: 'actions', render: (_, item) => <Space>
                <Button onClick={() => showEditor(item)}>Sửa</Button>
                <Popconfirm title={`Xóa ngành hàng “${item.name}”?`} description="Hồ sơ và dữ liệu đã lưu vẫn được giữ nguyên." okText="Xóa" cancelText="Hủy" onConfirm={() => remove(item)}>
                  <Button danger loading={deletingId === item.id} disabled={deletingId !== null}>Xóa</Button>
                </Popconfirm>
              </Space> },
            ]}
            locale={{ emptyText: error ? 'Danh mục chưa tải được' : search ? 'Không tìm thấy ngành hàng phù hợp' : 'Chưa có ngành hàng. Hãy thêm ngành hàng đầu tiên.' }}
          />
        </Card>
      </Space>
      <Modal title={editing ? 'Sửa ngành hàng' : 'Thêm ngành hàng'} open={open} onCancel={() => { if (!saving) setOpen(false); }} onOk={() => form.submit()} confirmLoading={saving} okText="Lưu ngành hàng" cancelText="Hủy" closable={!saving} maskClosable={!saving} cancelButtonProps={{ disabled: saving }}>
        <Form form={form} layout="vertical" onFinish={save} style={{ marginTop: 20 }}>
          <Form.Item name="name" label="Tên ngành hàng" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên ngành hàng.' }, { max: 100, message: 'Tên ngành hàng tối đa 100 ký tự.' }]}>
            <Input maxLength={100} placeholder="Ví dụ: Làm đẹp và mỹ phẩm" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ max: 500, message: 'Mô tả tối đa 500 ký tự.' }]}>
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="active" label="Sử dụng trong danh sách lựa chọn" valuePropName="checked"><Switch checkedChildren="Bật" unCheckedChildren="Tắt" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
