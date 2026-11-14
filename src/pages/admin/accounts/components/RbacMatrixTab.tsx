import React, { useState, useEffect } from 'react';
import {
  Card, Table, Switch, Tag, Button, Select, Typography, Space,
  Alert, Spin, message, Input, Row, Col, Badge, Divider,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SafetyCertificateOutlined,
  SaveOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  CrownOutlined,
  TeamOutlined,
  UserOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import { adminService } from '../../../../services/api/adminService';
import type { RoleView } from '../../../../types/api/admin.types';

const { Title, Text } = Typography;
const { Option } = Select;

interface CapabilityItem {
  permission: string;
  name?: string;
  module?: string;
  enabled: boolean;
  defaultEnabled?: boolean;
  implemented?: boolean;
  editable?: boolean;
}

const ROLE_OPTIONS = [
  { value: 'BRAND', label: 'Doanh nghiệp (BRAND)', icon: <TeamOutlined />, color: '#0EA5E9' },
  { value: 'CREATOR', label: 'Nhà sáng tạo (CREATOR)', icon: <UserOutlined />, color: '#10B981' },
  { value: 'DATA_MANAGER', label: 'Quản trị Dữ liệu (DATA_MANAGER)', icon: <ControlOutlined />, color: '#F59E0B' },
  { value: 'ADMIN', label: 'Quản trị Cấp cao (ADMIN - Bất biến)', icon: <CrownOutlined />, color: '#8B5CF6' },
];

export default function RbacMatrixTab() {
  const [roleViews, setRoleViews] = useState<RoleView[]>(() => adminService.getRolePermissions.peek()?.value ?? []);
  const [loading, setLoading] = useState(() => !adminService.getRolePermissions.peek());
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('BRAND');
  const [search, setSearch] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  const loadPermissions = async (force = false) => {
    try {
      if (force) adminService.getRolePermissions.invalidate();
      setLoading(!adminService.getRolePermissions.peek());
      const data = await adminService.getRolePermissions();
      setRoleViews(data);
      setPendingChanges({});
    } catch {
      setRoleViews([]);
      message.error('Không thể tải ma trận phân quyền RBAC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const activeRoleView = roleViews.find((r) => r.role === selectedRole);
  const isImmutableAdmin = selectedRole === 'ADMIN';

  // Normalize permissions into CapabilityItem
  const capabilities: CapabilityItem[] = (activeRoleView?.permissions || []).map((p: any) => {
    if (typeof p === 'string') {
      return {
        permission: p,
        name: p,
        module: p.split('_')[0] || 'CHUNG',
        enabled: true,
        editable: !isImmutableAdmin,
      };
    }
    return {
      permission: p.permission || p.name || 'PERMISSION',
      name: p.name || p.description || p.permission,
      module: p.module || (p.permission ? p.permission.split('_')[0] : 'CHUNG'),
      enabled: pendingChanges[p.permission || p.name] !== undefined ? pendingChanges[p.permission || p.name] : !!p.enabled,
      defaultEnabled: p.defaultEnabled,
      implemented: p.implemented !== false,
      editable: isImmutableAdmin ? false : p.editable !== false,
    };
  });

  const availableModules = Array.from(new Set(capabilities.map((c) => c.module || 'CHUNG')));

  const filteredCapabilities = capabilities.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || c.permission.toLowerCase().includes(q) || (c.name && c.name.toLowerCase().includes(q));
    const matchesModule = moduleFilter === 'all' || c.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const handleToggle = (permission: string, currentVal: boolean) => {
    if (isImmutableAdmin) {
      message.info('Vai trò ADMIN là bất biến (Immutable), không thể vô hiệu hóa quyền hạn cốt lõi.');
      return;
    }
    setPendingChanges((prev) => ({
      ...prev,
      [permission]: !currentVal,
    }));
  };

  const handleSaveChanges = async () => {
    const changeKeys = Object.keys(pendingChanges);
    if (changeKeys.length === 0) {
      message.info('Chưa có thay đổi phân quyền nào để lưu.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        version: activeRoleView?.version ?? 1,
        changes: changeKeys.map((k) => ({
          permission: k,
          enabled: pendingChanges[k],
        })),
      };

      await adminService.updateRolePermissions(selectedRole, payload);
      message.success(`Đã cập nhật thành công ${changeKeys.length} quyền hạn cho vai trò ${selectedRole}`);
      await loadPermissions();
    } catch {
      message.error('Không thể cập nhật phân quyền RBAC. Vui lòng kiểm tra lại quyền Admin của bạn.');
    } finally {
      setSaving(false);
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const columns: TableColumnsType<CapabilityItem> = [
    {
      title: 'Mã định danh quyền (Permission Key)',
      key: 'permission',
      width: 280,
      render: (_, r) => (
        <div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
            {r.permission}
          </span>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
            Module: <Tag style={{ fontSize: 10.5, borderRadius: 6 }}>{r.module}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Tên năng lực & Phạm vi hoạt động',
      key: 'name',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{r.name}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            {r.implemented ? (
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircleOutlined /> Đã sẵn sàng trên backend API
              </span>
            ) : (
              <span style={{ color: '#F59E0B' }}>Đang hoàn thiện</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái cấp phép',
      key: 'status',
      width: 170,
      render: (_, r) => {
        const isCurrentEnabled = pendingChanges[r.permission] !== undefined ? pendingChanges[r.permission] : r.enabled;
        return (
          <Tag
            color={isCurrentEnabled ? 'success' : 'default'}
            style={{ fontWeight: 700, borderRadius: 12, padding: '2px 10px' }}
          >
            {isCurrentEnabled ? 'Cho phép' : 'Vô hiệu hóa'}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác phân quyền',
      key: 'action',
      width: 140,
      align: 'right',
      render: (_, r) => {
        const isCurrentEnabled = pendingChanges[r.permission] !== undefined ? pendingChanges[r.permission] : r.enabled;
        return (
          <Space>
            <Switch
              checked={isCurrentEnabled}
              disabled={isImmutableAdmin}
              onChange={() => handleToggle(r.permission, isCurrentEnabled)}
              style={{
                background: isCurrentEnabled ? '#2563EB' : undefined,
              }}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Top Banner Alert */}
      <Alert
        type={isImmutableAdmin ? 'info' : 'warning'}
        showIcon
        message={
          isImmutableAdmin
            ? 'Vai trò Quản trị viên cấp cao (ADMIN) sở hữu quyền tối cao toàn hệ thống và không thể bị chỉnh sửa trực tiếp.'
            : `Đang quản trị phân bổ quyền hạn cho nhóm vai trò ${selectedRole}. Các thay đổi sẽ có hiệu lực ngay trong phiên làm việc tiếp theo của người dùng.`
        }
        style={{ marginBottom: 16, borderRadius: 10 }}
      />

      {/* Control Bar */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          background: '#F8FAFC',
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row gutter={[16, 12]} align="middle" justify="space-between">
          <Col xs={24} md={14}>
            <Space wrap size="middle">
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginRight: 8 }}>
                  Chọn Vai trò (Role):
                </span>
                <Select
                  value={selectedRole}
                  onChange={(val) => {
                    setSelectedRole(val);
                    setPendingChanges({});
                  }}
                  style={{ width: 260 }}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      <Space>
                        {opt.icon}
                        <span style={{ fontWeight: 600 }}>{opt.label}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>

              <Select
                value={moduleFilter}
                onChange={setModuleFilter}
                style={{ width: 150 }}
              >
                <Option value="all">Tất cả module</Option>
                {availableModules.map((m) => (
                  <Option key={m} value={m}>
                    {m}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Input
              placeholder="Tìm kiếm năng lực (permission)..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220, borderRadius: 8 }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void loadPermissions(true)}
              loading={loading}
              style={{ borderRadius: 8 }}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              disabled={!hasPendingChanges || isImmutableAdmin}
              loading={saving}
              onClick={handleSaveChanges}
              style={{
                borderRadius: 8,
                background: hasPendingChanges ? '#2563EB' : undefined,
                fontWeight: 700,
              }}
            >
              Lưu phân quyền ({Object.keys(pendingChanges).length})
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Permissions Matrix Table */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <Table<CapabilityItem>
          rowKey="permission"
          columns={columns}
          dataSource={filteredCapabilities}
          loading={loading}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          locale={{ emptyText: 'Không tìm thấy quyền hạn nào phù hợp.' }}
        />
      </Card>
    </div>
  );
}

