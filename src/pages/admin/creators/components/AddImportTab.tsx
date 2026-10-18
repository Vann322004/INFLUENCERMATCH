import React, { useState } from 'react';
import {
  Row, Col, Card, Tabs, Form, Input, Select, Button, Upload, Table,
  Typography, message, Tag, Divider,
} from 'antd';
import {
  UserAddOutlined, UploadOutlined, DownloadOutlined,
  InstagramOutlined, YoutubeOutlined, LinkOutlined, CheckCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

function ManualAddForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);
      await new Promise(r => setTimeout(r, 700));
      message.success('Đã thêm creator thành công!');
      form.resetFields();
    } catch { /* validation */ }
    finally { setLoading(false); }
  };

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 560 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="platform" label="Platform" rules={[{ required: true }]} initialValue="tiktok">
            <Select>
              <Option value="tiktok">🎵 TikTok</Option>
              <Option value="instagram"><InstagramOutlined style={{ color: '#E1306C' }} /> Instagram</Option>
              <Option value="youtube"><YoutubeOutlined style={{ color: '#FF0000' }} /> YouTube</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="handle" label="Handle / Username" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input prefix="@" placeholder="creator_handle" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="profileUrl" label="Profile URL" rules={[{ required: true }, { type: 'url', message: 'URL không hợp lệ' }]}>
        <Input prefix={<LinkOutlined />} placeholder="https://www.tiktok.com/@handle" />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="category" label="Danh mục">
            <Select placeholder="Chọn category">
              <Option value="Fashion">Fashion</Option>
              <Option value="Beauty">Beauty</Option>
              <Option value="Food">Food</Option>
              <Option value="Travel">Travel</Option>
              <Option value="Tech">Tech</Option>
              <Option value="Fitness">Fitness</Option>
              <Option value="Lifestyle">Lifestyle</Option>
              <Option value="Gaming">Gaming</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="country" label="Quốc gia" initialValue="VN">
            <Select>
              <Option value="VN">🇻🇳 Việt Nam</Option>
              <Option value="US">🇺🇸 USA</Option>
              <Option value="TH">🇹🇭 Thái Lan</Option>
              <Option value="SG">🇸🇬 Singapore</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="note" label="Ghi chú nội bộ">
        <TextArea rows={2} placeholder="Ghi chú thêm..." style={{ resize: 'none' }} />
      </Form.Item>
      <Button type="primary" loading={loading} onClick={handleSubmit} icon={<UserAddOutlined />}
        style={{ background: 'linear-gradient(135deg, #5B5BF0, #7C3AED)', border: 'none', fontWeight: 700 }}>
        Thêm Creator
      </Button>
    </Form>
  );
}

function CsvImportForm() {
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const SAMPLE_ROWS = [
    { key: '1', handle: '@creator_a', platform: 'tiktok',    followers: '1.2M', category: 'Fashion', status: '✅ Hợp lệ' },
    { key: '2', handle: '@creator_b', platform: 'instagram', followers: '450K', category: 'Beauty',  status: '✅ Hợp lệ' },
    { key: '3', handle: '@creator_c', platform: 'youtube',   followers: '800K', category: 'Food',    status: '⚠️ Trùng' },
  ];

  const columns = [
    { title: 'Handle',    dataIndex: 'handle',    key: 'handle' },
    { title: 'Platform',  dataIndex: 'platform',  key: 'platform' },
    { title: 'Followers', dataIndex: 'followers', key: 'followers' },
    { title: 'Category',  dataIndex: 'category',  key: 'category' },
    { title: 'Trạng thái', dataIndex: 'status',   key: 'status' },
  ];

  const handleConfirmImport = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    message.success('Đã import 2 creator thành công! (1 trùng đã bỏ qua)');
    setImportedRows([]);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Download template */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        padding: '12px 16px', background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
        <DownloadOutlined style={{ color: '#2563EB', fontSize: 18 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1D4ED8' }}>Tải template CSV mẫu</div>
          <div style={{ color: '#3B82F6', fontSize: 12 }}>handle, platform, followers, category, country, profile_url</div>
        </div>
        <Button size="small" icon={<DownloadOutlined />}
          style={{ marginLeft: 'auto', color: '#2563EB', borderColor: '#2563EB' }}>
          Tải xuống
        </Button>
      </div>

      {/* Upload */}
      <Upload.Dragger
        accept=".csv"
        maxCount={1}
        showUploadList={false}
        beforeUpload={() => { setImportedRows(SAMPLE_ROWS); return false; }}
        style={{ padding: '20px 0', borderRadius: 10 }}
      >
        <p style={{ fontSize: 32, margin: '0 0 6px' }}>📂</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Kéo thả file CSV vào đây</p>
        <p style={{ color: '#94A3B8', fontSize: 12 }}>hoặc click để chọn file — tối đa 500 dòng</p>
      </Upload.Dragger>

      {/* Preview */}
      {importedRows.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Divider titlePlacement="left" style={{ fontSize: 13, fontWeight: 700 }}>Preview dữ liệu import</Divider>
          <Table columns={columns} dataSource={importedRows} size="small" pagination={false} style={{ marginBottom: 14 }} />
          <Button type="primary" loading={loading} onClick={handleConfirmImport} icon={<CheckCircleOutlined />}
            style={{ background: '#10B981', border: 'none', fontWeight: 700 }}>
            Xác nhận Import (2 creator hợp lệ)
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AddImportTab() {
  return (
    <div>
      <Tabs
        type="card"
        size="small"
        items={[
          { key: 'manual', label: <span><UserAddOutlined /> Thêm thủ công</span>, children: <div style={{ paddingTop: 20 }}><ManualAddForm /></div> },
          { key: 'csv',    label: <span><UploadOutlined /> Import CSV</span>,     children: <div style={{ paddingTop: 20 }}><CsvImportForm /></div> },
        ]}
      />
    </div>
  );
}
