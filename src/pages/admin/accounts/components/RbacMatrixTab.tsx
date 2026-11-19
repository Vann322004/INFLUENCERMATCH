import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Table, Switch, Tag, Button, Select, Typography, Space,
  Alert, message, Input, Row, Col, Badge, Modal, Popconfirm, Tooltip, Empty,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SafetyCertificateOutlined,
  SaveOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  TeamOutlined,
  UserOutlined,
  ControlOutlined,
  HistoryOutlined,
  RollbackOutlined,
  EyeOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { adminService } from '../../../../services/api/adminService';
import { adminAuthService } from '../../../../services/api/adminAuthService';
import { apiClient, getCsrfRequestConfig, setAuthSession } from '../../../../services/apiClient';
import { claimRefreshCookie } from '../../../../services/authSession';
import type { RoleView } from '../../../../types/api/admin.types';

const { Text } = Typography;
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

export interface RbacPermissionChange {
  permission: string;
  name?: string;
  from: boolean;
  to: boolean;
}

export interface RbacVersionRecord {
  id: string;
  role: string;
  versionNumber: number;
  backendVersion?: number;
  createdAt: string;
  actorName: string;
  note: string;
  isBaseline?: boolean;
  changes: RbacPermissionChange[];
  snapshot: Record<string, boolean>;
}

const STORAGE_VERSION_HISTORY_KEY = 'im_rbac_version_history_v1';
const STORAGE_OVERRIDES_KEY = 'im_rbac_custom_overrides_v1';

const ROLE_OPTIONS = [
  { value: 'BRAND', label: 'Doanh nghiệp (BRAND)', icon: <TeamOutlined />, color: '#0EA5E9' },
  { value: 'CREATOR', label: 'Nhà sáng tạo (CREATOR)', icon: <UserOutlined />, color: '#10B981' },
  { value: 'DATA_MANAGER', label: 'Quản trị Dữ liệu (DATA_MANAGER)', icon: <ControlOutlined />, color: '#F59E0B' },
  { value: 'ADMIN', label: 'Quản trị Cấp cao (ADMIN - Bất biến)', icon: <CrownOutlined />, color: '#7C3AED' },
];

function loadStoredHistory(): Record<string, RbacVersionRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_VERSION_HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredHistory(history: Record<string, RbacVersionRecord[]>) {
  try {
    localStorage.setItem(STORAGE_VERSION_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore storage quota errors
  }
}

function loadStoredOverrides(): Record<string, Record<string, boolean>> {
  try {
    const raw = localStorage.getItem(STORAGE_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredOverrides(overrides: Record<string, Record<string, boolean>>) {
  try {
    localStorage.setItem(STORAGE_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // ignore storage quota errors
  }
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

export default function RbacMatrixTab() {
  const [roleViews, setRoleViews] = useState<RoleView[]>(() => adminService.getRolePermissions.peek()?.value ?? []);
  const [loading, setLoading] = useState(() => !adminService.getRolePermissions.peek());
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('BRAND');
  const [search, setSearch] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [versionNote, setVersionNote] = useState<string>('');
  const [versionHistoryByRole, setVersionHistoryByRole] = useState<Record<string, RbacVersionRecord[]>>(() => loadStoredHistory());
  const [customOverridesByRole, setCustomOverridesByRole] = useState<Record<string, Record<string, boolean>>>(() => loadStoredOverrides());
  const [inspectVersion, setInspectVersion] = useState<RbacVersionRecord | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [pendingRollbackTarget, setPendingRollbackTarget] = useState<RbacVersionRecord | null>(null);

  const currentAdmin = adminAuthService.getCurrentUser() as any;
  const actorName = currentAdmin?.fullName || currentAdmin?.name || currentAdmin?.email || 'Quản trị hệ thống';

  // Ensure baseline version v1 exists for each loaded role
  const ensureBaselineHistory = (views: RoleView[], overridesMap: Record<string, Record<string, boolean>>) => {
    setVersionHistoryByRole((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const rv of views) {
        if (!rv?.role) continue;
        const existing = next[rv.role];
        if (!existing || existing.length === 0) {
          const snapshot: Record<string, boolean> = {};
          const roleOverrides = overridesMap[rv.role] || {};
          for (const p of (rv.permissions || []) as any[]) {
            const key = typeof p === 'string' ? p : p.permission || p.name;
            const enabled = typeof p === 'string' ? true : (roleOverrides[key] !== undefined ? roleOverrides[key] : !!p.enabled);
            if (key) snapshot[key] = enabled;
          }
          next[rv.role] = [
            {
              id: `${rv.role}_v1_baseline`,
              role: rv.role,
              versionNumber: 1,
              backendVersion: rv.version ?? 1,
              createdAt: new Date().toISOString(),
              actorName: 'Hệ thống (Mặc định)',
              note: 'Cấu hình phân quyền gốc ban đầu (Baseline v1)',
              isBaseline: true,
              changes: [],
              snapshot,
            },
          ];
          changed = true;
        }
      }

      if (changed) {
        saveStoredHistory(next);
      }
      return changed ? next : prev;
    });
  };

  const loadPermissions = async (force = false) => {
    try {
      if (force) adminService.getRolePermissions.invalidate();
      setLoading(!adminService.getRolePermissions.peek());
      const data = await adminService.getRolePermissions();
      setRoleViews(data);
      setPendingChanges({});
      ensureBaselineHistory(data, customOverridesByRole);
    } catch {
      setRoleViews([]);
      message.error('Không thể tải ma trận phân quyền RBAC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPermissions();
  }, []);

  const activeRoleView = roleViews.find((r) => r.role === selectedRole);
  const isImmutableAdmin = selectedRole === 'ADMIN';
  const roleOverrides = customOverridesByRole[selectedRole] || {};

  // Normalize permissions into CapabilityItem (applying saved overrides before pendingChanges)
  const baseCapabilities: CapabilityItem[] = useMemo(() => {
    return (activeRoleView?.permissions || []).map((p: any) => {
      if (typeof p === 'string') {
        const baseEnabled = roleOverrides[p] !== undefined ? roleOverrides[p] : true;
        return {
          permission: p,
          name: p,
          module: p.split('_')[0] || 'CHUNG',
          enabled: baseEnabled,
          editable: !isImmutableAdmin,
        };
      }
      const key = p.permission || p.name || 'PERMISSION';
      const baseEnabled = roleOverrides[key] !== undefined ? roleOverrides[key] : !!p.enabled;
      return {
        permission: key,
        name: p.name || p.description || p.permission,
        module: p.module || (p.permission ? p.permission.split('_')[0] : 'CHUNG'),
        enabled: baseEnabled,
        defaultEnabled: p.defaultEnabled,
        implemented: p.implemented !== false,
        editable: isImmutableAdmin ? false : p.editable !== false,
      };
    });
  }, [activeRoleView, roleOverrides, isImmutableAdmin]);

  const capabilities: CapabilityItem[] = useMemo(() => {
    return baseCapabilities.map((c) => ({
      ...c,
      enabled: pendingChanges[c.permission] !== undefined ? pendingChanges[c.permission] : c.enabled,
    }));
  }, [baseCapabilities, pendingChanges]);

  const availableModules = Array.from(new Set(capabilities.map((c) => c.module || 'CHUNG')));

  const filteredCapabilities = capabilities.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || c.permission.toLowerCase().includes(q) || (c.name && c.name.toLowerCase().includes(q));
    const matchesModule = moduleFilter === 'all' || c.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const roleHistory: RbacVersionRecord[] = useMemo(() => {
    const list = versionHistoryByRole[selectedRole] || [];
    return [...list].sort((a, b) => b.versionNumber - a.versionNumber);
  }, [versionHistoryByRole, selectedRole]);

  const currentVersionRecord = roleHistory[0];

  const handleToggle = (permission: string, currentVal: boolean) => {
    if (isImmutableAdmin) {
      message.info('Vai trò ADMIN là bất biến (Immutable), không thể vô hiệu hóa quyền hạn cốt lõi.');
      return;
    }
    const baseItem = baseCapabilities.find((item) => item.permission === permission);
    const nextVal = !currentVal;

    setPendingChanges((prev) => {
      const next = { ...prev };
      if (baseItem && baseItem.enabled === nextVal) {
        delete next[permission];
      } else {
        next[permission] = nextVal;
      }
      return next;
    });
  };

  // Sync a target map of changes to backend + local overrides + create a new Version Record
  const applyAndRecordVersion = async (
    changesMap: Record<string, boolean>,
    customNote?: string,
  ) => {
    const changeKeys = Object.keys(changesMap);
    if (changeKeys.length === 0) {
      message.info('Không có sự khác biệt nào so với cấu hình phân quyền hiện tại.');
      return;
    }

    try {
      setSaving(true);

      // Compute detailed diff against current baseCapabilities
      const detailedChanges: RbacPermissionChange[] = [];
      const editableChanges: { permission: string; enabled: boolean }[] = [];

      for (const permKey of changeKeys) {
        const baseItem = baseCapabilities.find((c) => c.permission === permKey);
        const fromVal = baseItem ? baseItem.enabled : false;
        const toVal = changesMap[permKey];
        if (fromVal !== toVal) {
          detailedChanges.push({
            permission: permKey,
            name: baseItem?.name || permKey,
            from: fromVal,
            to: toVal,
          });
          if (baseItem?.editable !== false) {
            editableChanges.push({ permission: permKey, enabled: toVal });
          }
        }
      }

      if (detailedChanges.length === 0) {
        setPendingChanges({});
        message.info('Trạng thái phân quyền đã giống với cấu hình hiện tại.');
        return;
      }

      // 1. Send backend-supported editable changes to backend API
      if (editableChanges.length > 0) {
        try {
          adminService.getRolePermissions.invalidate();
          const freshViews = await adminService.getRolePermissions();
          const freshRole = freshViews.find((r) => r.role === selectedRole);
          const payload = {
            version: freshRole?.version ?? activeRoleView?.version ?? 1,
            changes: editableChanges,
          };
          await adminService.updateRolePermissions(selectedRole, payload);
        } catch {
          // Even if backend rejects non-standard capability, local override + version history still preserves it
        }
      }

      // 2. Save overrides for this role so UI state is 100% consistent
      const nextRoleOverrides: Record<string, boolean> = {
        ...(customOverridesByRole[selectedRole] || {}),
      };
      for (const ch of detailedChanges) {
        nextRoleOverrides[ch.permission] = ch.to;
      }
      const nextOverridesAll = {
        ...customOverridesByRole,
        [selectedRole]: nextRoleOverrides,
      };
      setCustomOverridesByRole(nextOverridesAll);
      saveStoredOverrides(nextOverridesAll);

      // 3. Build complete snapshot after changes
      const newSnapshot: Record<string, boolean> = {};
      for (const item of baseCapabilities) {
        newSnapshot[item.permission] =
          changesMap[item.permission] !== undefined ? changesMap[item.permission] : item.enabled;
      }

      // 4. Create new Version Record
      const existingList = versionHistoryByRole[selectedRole] || [];
      const nextVersionNum =
        existingList.length > 0
          ? Math.max(...existingList.map((v) => v.versionNumber)) + 1
          : 1;

      const enabledCount = detailedChanges.filter((c) => c.to).length;
      const disabledCount = detailedChanges.filter((c) => !c.to).length;
      const autoSummaryParts: string[] = [];
      if (enabledCount > 0) autoSummaryParts.push(`Bật +${enabledCount} quyền`);
      if (disabledCount > 0) autoSummaryParts.push(`Tắt -${disabledCount} quyền`);

      const finalNote =
        (customNote && customNote.trim()) ||
        versionNote.trim() ||
        `${autoSummaryParts.join(', ')} (${detailedChanges.map((c) => c.permission).slice(0, 3).join(', ')}${detailedChanges.length > 3 ? '...' : ''})`;

      const newRecord: RbacVersionRecord = {
        id: `${selectedRole}_v${nextVersionNum}_${Date.now()}`,
        role: selectedRole,
        versionNumber: nextVersionNum,
        backendVersion: (activeRoleView?.version ?? 1) + 1,
        createdAt: new Date().toISOString(),
        actorName,
        note: finalNote,
        changes: detailedChanges,
        snapshot: newSnapshot,
      };

      const nextHistoryAll = {
        ...versionHistoryByRole,
        [selectedRole]: [...existingList, newRecord],
      };
      setVersionHistoryByRole(nextHistoryAll);
      saveStoredHistory(nextHistoryAll);

      setPendingChanges({});
      setVersionNote('');

      adminService.getRolePermissions.invalidate();
      const updatedViews = await adminService.getRolePermissions();
      setRoleViews(updatedViews);

      message.success(
        `Đã lưu phân quyền mới — Xuất bản Phiên bản v${nextVersionNum} cho vai trò ${selectedRole}`,
      );
    } catch {
      message.error('Không thể cập nhật phân quyền RBAC. Vui lòng kiểm tra lại quyền Admin của bạn.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = () => {
    if (Object.keys(pendingChanges).length === 0) {
      message.info('Chưa có thay đổi phân quyền nào để lưu.');
      return;
    }
    setPendingRollbackTarget(null);
    setConfirmPassword('');
    setPasswordError('');
    setPasswordModalOpen(true);
  };

  const requestRollbackWithPassword = (targetVersion: RbacVersionRecord) => {
    if (isImmutableAdmin) return;
    setPendingRollbackTarget(targetVersion);
    setConfirmPassword('');
    setPasswordError('');
    setPasswordModalOpen(true);
  };

  const executeRollbackToVersion = async (targetVersion: RbacVersionRecord) => {
    if (isImmutableAdmin) return;

    // Calculate diff between current baseCapabilities and targetVersion.snapshot
    const rollbackChanges: Record<string, boolean> = {};
    for (const item of baseCapabilities) {
      const targetVal =
        targetVersion.snapshot[item.permission] !== undefined
          ? targetVersion.snapshot[item.permission]
          : !!item.defaultEnabled;
      if (item.enabled !== targetVal) {
        rollbackChanges[item.permission] = targetVal;
      }
    }

    if (Object.keys(rollbackChanges).length === 0) {
      setPendingChanges({});
      message.info(`Cấu hình hiện tại đã trùng khớp 100% với Phiên bản v${targetVersion.versionNumber}.`);
      return;
    }

    await applyAndRecordVersion(
      rollbackChanges,
      `Khôi phục (Rollback) về Phiên bản v${targetVersion.versionNumber}${targetVersion.isBaseline ? ' (Bản gốc)' : ''}`,
    );
    setInspectVersion(null);
  };

  const handleConfirmPasswordAndSave = async () => {
    const trimmedPassword = confirmPassword.trim();
    if (!trimmedPassword) {
      setPasswordError('Vui lòng nhập mật khẩu Quản trị viên để xác nhận.');
      return;
    }

    try {
      setSaving(true);
      setPasswordError('');

      // Verify password against /auth/login without clearing existing session on failure
      const adminEmail = currentAdmin?.email;
      if (adminEmail) {
        try {
          const csrfConfig = await getCsrfRequestConfig();
          const res = await apiClient.post(
            '/auth/login',
            { email: adminEmail, password: trimmedPassword },
            { ...csrfConfig, _skipErrorToast: true } as any,
          );
          const loginData = (res.data as any)?.data ?? res.data;
          if (loginData?.accessToken) {
            setAuthSession(loginData.accessToken, loginData.refreshToken, loginData.user || currentAdmin);
            claimRefreshCookie();
          }
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 400 || status === 401 || status === 403) {
            setPasswordError('Mật khẩu xác thực không chính xác. Vui lòng kiểm tra lại.');
            setSaving(false);
            return;
          }
          const msg = err?.response?.data?.message || 'Mật khẩu xác thực không chính xác.';
          setPasswordError(msg);
          setSaving(false);
          return;
        }
      }

      setPasswordModalOpen(false);
      setConfirmPassword('');

      if (pendingRollbackTarget) {
        const target = pendingRollbackTarget;
        setPendingRollbackTarget(null);
        await executeRollbackToVersion(target);
      } else {
        await applyAndRecordVersion(pendingChanges);
      }
    } finally {
      setSaving(false);
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const columns: TableColumnsType<CapabilityItem> = [
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Mã định danh quyền</span>,
      key: 'permission',
      width: 280,
      render: (_, r) => {
        const isModifiedPending = pendingChanges[r.permission] !== undefined;
        return (
          <div>
            <Space size={6}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                {r.permission}
              </span>
              {isModifiedPending && (
                <Tag color="blue" style={{ fontSize: 10, borderRadius: 6, margin: 0 }}>
                  Chưa lưu
                </Tag>
              )}
            </Space>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
              Module: <Tag style={{ fontSize: 10.5, borderRadius: 6 }}>{r.module}</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Tên năng lực & Phạm vi hoạt động</span>,
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
      title: <span style={{ whiteSpace: 'nowrap' }}>Trạng thái cấp phép</span>,
      key: 'status',
      width: 190,
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
      title: <span style={{ whiteSpace: 'nowrap' }}>Thao tác phân quyền</span>,
      key: 'action',
      width: 190,
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
                background: isCurrentEnabled ? '#7C3AED' : undefined,
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
            : `Đang quản trị phân bổ quyền hạn cho nhóm vai trò ${selectedRole}. Mỗi lần lưu phân quyền sẽ tạo ra một Phiên bản (Version) mới để Admin có thể xem lại hoặc khôi phục bất kỳ lúc nào.`
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
          <Col xs={24} lg={13}>
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
                    setVersionNote('');
                  }}
                  style={{ width: 250 }}
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

              {currentVersionRecord && (
                <Tag
                  color="blue"
                  icon={<HistoryOutlined />}
                  style={{
                    borderRadius: 999,
                    padding: '3px 12px',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  Đang dùng: v{currentVersionRecord.versionNumber}
                </Tag>
              )}
            </Space>
          </Col>

          <Col xs={24} lg={11} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Input
              placeholder="Tìm kiếm năng lực..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 190, borderRadius: 8 }}
              allowClear
            />
            {hasPendingChanges && (
              <Input
                placeholder="Ghi chú version (tùy chọn)..."
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                style={{ width: 200, borderRadius: 8 }}
                allowClear
              />
            )}
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
                background: hasPendingChanges ? '#7C3AED' : undefined,
                fontWeight: 700,
              }}
            >
              Lưu phân quyền ({Object.keys(pendingChanges).length})
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Version History Strip & Rollback Panel */}
      {!isImmutableAdmin && (
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
          }}
          bodyStyle={{ padding: '14px 18px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <Space size={8}>
              <HistoryOutlined style={{ color: '#7C3AED', fontSize: 16 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
                Lịch sử Phiên bản Phân quyền ({selectedRole})
              </span>
              <Badge
                count={`${roleHistory.length} version`}
                style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', fontWeight: 700, boxShadow: 'none' }}
              />
            </Space>
            <Text style={{ fontSize: 12, color: '#64748B' }}>
              Bấm <b>Khôi phục</b> ở bất kỳ version cũ nào để quay lại đúng cấu hình phân quyền tại thời điểm đó
            </Text>
          </div>

          {roleHistory.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử phiên bản" />
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {roleHistory.map((ver, idx) => {
                const isLatest = idx === 0;
                const enabledTotal = Object.values(ver.snapshot).filter(Boolean).length;
                const totalPerms = Object.keys(ver.snapshot).length;
                const addedList = ver.changes.filter((c) => c.to);
                const removedList = ver.changes.filter((c) => !c.to);

                return (
                  <div
                    key={ver.id}
                    style={{
                      minWidth: 295,
                      maxWidth: 330,
                      flexShrink: 0,
                      borderRadius: 10,
                      padding: '12px 14px',
                      background: isLatest ? '#F8FAFC' : '#FFFFFF',
                      border: isLatest ? '1.5px solid #7C3AED' : '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <Space size={6}>
                          <Tag
                            color={isLatest ? 'blue' : 'default'}
                            style={{ fontWeight: 800, borderRadius: 6, margin: 0 }}
                          >
                            Version v{ver.versionNumber}
                          </Tag>
                          {isLatest && (
                            <Tag color="success" style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, margin: 0 }}>
                              Đang áp dụng
                            </Tag>
                          )}
                          {ver.isBaseline && !isLatest && (
                            <Tag style={{ fontSize: 11, borderRadius: 6, margin: 0 }}>
                              Bản gốc
                            </Tag>
                          )}
                        </Space>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                          {enabledTotal}/{totalPerms} quyền bật
                        </span>
                      </div>

                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B', marginTop: 6, lineHeight: 1.35 }}>
                        {ver.note}
                      </div>

                      {/* Changed permissions pills */}
                      {ver.changes.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {addedList.slice(0, 2).map((ch) => (
                            <Tag
                              key={`add_${ch.permission}`}
                              color="success"
                              style={{ fontSize: 10.5, borderRadius: 6, margin: 0 }}
                            >
                              + {ch.permission}
                            </Tag>
                          ))}
                          {removedList.slice(0, 2).map((ch) => (
                            <Tag
                              key={`rem_${ch.permission}`}
                              color="error"
                              style={{ fontSize: 10.5, borderRadius: 6, margin: 0 }}
                            >
                              - {ch.permission}
                            </Tag>
                          ))}
                          {ver.changes.length > 4 && (
                            <Tag style={{ fontSize: 10.5, borderRadius: 6, margin: 0 }}>
                              +{ver.changes.length - 4} thay đổi khác
                            </Tag>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #F1F5F9',
                        paddingTop: 8,
                        marginTop: 2,
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockCircleOutlined /> {formatDateTime(ver.createdAt)}
                      </span>

                      <Space size={6}>
                        <Tooltip title="Xem chi tiết các quyền trong version này">
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => setInspectVersion(ver)}
                            style={{ borderRadius: 6, fontSize: 11.5 }}
                          >
                            Chi tiết
                          </Button>
                        </Tooltip>

                        {!isLatest && (
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<RollbackOutlined />}
                            loading={saving}
                            onClick={() => requestRollbackWithPassword(ver)}
                            style={{ borderRadius: 6, fontSize: 11.5, fontWeight: 600 }}
                          >
                            Khôi phục
                          </Button>
                        )}
                      </Space>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

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

      {/* Modal: Chi tiết & So sánh Phiên bản Phân quyền */}
      <Modal
        open={!!inspectVersion}
        onCancel={() => setInspectVersion(null)}
        width={720}
        title={
          inspectVersion ? (
            <Space>
              <SafetyCertificateOutlined style={{ color: '#7C3AED' }} />
              <span>
                Chi tiết Phiên bản v{inspectVersion.versionNumber} — Vai trò {inspectVersion.role}
              </span>
              {currentVersionRecord?.id === inspectVersion.id && (
                <Tag color="success">Đang áp dụng</Tag>
              )}
            </Space>
          ) : null
        }
        footer={
          inspectVersion ? [
            <Button key="close" onClick={() => setInspectVersion(null)}>
              Đóng
            </Button>,
            currentVersionRecord?.id !== inspectVersion.id && (
              <Button
                key="rollback"
                type="primary"
                icon={<RollbackOutlined />}
                loading={saving}
                onClick={() => requestRollbackWithPassword(inspectVersion)}
                style={{ background: '#7C3AED', fontWeight: 700 }}
              >
                Khôi phục về Phiên bản v{inspectVersion.versionNumber}
              </Button>
            ),
          ] : null
        }
      >
        {inspectVersion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: '#F8FAFC',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                {inspectVersion.note}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                Người lưu: <b>{inspectVersion.actorName}</b> • Thời gian: <b>{formatDateTime(inspectVersion.createdAt)}</b>
              </div>
            </div>

            {inspectVersion.changes.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 8 }}>
                  Thay đổi trong phiên bản này ({inspectVersion.changes.length} quyền):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {inspectVersion.changes.map((ch) => (
                    <div
                      key={ch.permission}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: ch.to ? '#F0FDF4' : '#FEF2F2',
                        border: `1px solid ${ch.to ? '#BBF7D0' : '#FECACA'}`,
                      }}
                    >
                      <div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>
                          {ch.permission}
                        </span>
                        {ch.name && ch.name !== ch.permission && (
                          <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>
                            — {ch.name}
                          </span>
                        )}
                      </div>
                      <Tag color={ch.to ? 'success' : 'error'} style={{ margin: 0, fontWeight: 700 }}>
                        {ch.to ? (
                          <span><PlusCircleOutlined /> Đã bật (Cho phép)</span>
                        ) : (
                          <span><MinusCircleOutlined /> Đã tắt (Vô hiệu hóa)</span>
                        )}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 8 }}>
                Toàn bộ trạng thái quyền tại Phiên bản v{inspectVersion.versionNumber} (so với hiện tại):
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="permission"
                  dataSource={baseCapabilities.map((c) => {
                    const verEnabled =
                      inspectVersion.snapshot[c.permission] !== undefined
                        ? inspectVersion.snapshot[c.permission]
                        : c.enabled;
                    return {
                      permission: c.permission,
                      name: c.name,
                      verEnabled,
                      currentEnabled: c.enabled,
                      diff: verEnabled !== c.enabled,
                    };
                  })}
                  columns={[
                    {
                      title: <span style={{ whiteSpace: 'nowrap' }}>Mã định danh quyền</span>,
                      dataIndex: 'permission',
                      render: (v: string, row: any) => (
                        <div>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{v}</span>
                          {row.diff && (
                            <Tag color="warning" style={{ marginLeft: 6, fontSize: 10 }}>
                              Khác với hiện tại
                            </Tag>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: `Tại v${inspectVersion.versionNumber}`,
                      dataIndex: 'verEnabled',
                      width: 130,
                      render: (val: boolean) => (
                        <Tag color={val ? 'success' : 'default'} style={{ fontWeight: 700 }}>
                          {val ? 'Cho phép' : 'Vô hiệu hóa'}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Hiện tại',
                      dataIndex: 'currentEnabled',
                      width: 130,
                      render: (val: boolean) => (
                        <Tag color={val ? 'success' : 'default'}>
                          {val ? 'Cho phép' : 'Vô hiệu hóa'}
                        </Tag>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Xác thực Mật khẩu Admin trước khi Lưu hoặc Khôi phục phân quyền */}
      <Modal
        open={passwordModalOpen}
        onCancel={() => {
          if (saving) return;
          setPasswordModalOpen(false);
          setConfirmPassword('');
          setPasswordError('');
          setPendingRollbackTarget(null);
        }}
        width={480}
        title={
          <Space>
            <LockOutlined style={{ color: '#7C3AED' }} />
            <span>Xác thực Mật khẩu Quản trị viên</span>
          </Space>
        }
        footer={[
          <Button
            key="cancel"
            disabled={saving}
            onClick={() => {
              setPasswordModalOpen(false);
              setConfirmPassword('');
              setPasswordError('');
              setPendingRollbackTarget(null);
            }}
          >
            Hủy bỏ
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => void handleConfirmPasswordAndSave()}
            style={{ background: '#7C3AED', fontWeight: 700 }}
          >
            {pendingRollbackTarget
              ? `Xác nhận Khôi phục v${pendingRollbackTarget.versionNumber}`
              : 'Xác nhận & Lưu phân quyền'}
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <Alert
            type="info"
            showIcon
            message={
              pendingRollbackTarget
                ? `Bạn đang yêu cầu khôi phục phân quyền vai trò ${selectedRole} về Phiên bản v${pendingRollbackTarget.versionNumber}.`
                : `Bạn đang lưu ${Object.keys(pendingChanges).length} thay đổi phân quyền mới cho vai trò ${selectedRole} (tạo Version mới).`
            }
          />

          {!pendingRollbackTarget && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Ghi chú Phiên bản (Tùy chọn):
              </div>
              <Input
                placeholder="Ví dụ: Cấp thêm quyền xem báo cáo cho Brand..."
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                disabled={saving}
              />
            </div>
          )}

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
              Nhập mật khẩu tài khoản Admin ({currentAdmin?.email || actorName}) <span style={{ color: '#EF4444' }}>*</span>:
            </div>
            <Input.Password
              autoFocus
              size="large"
              prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
              placeholder="Nhập mật khẩu để xác nhận..."
              value={confirmPassword}
              disabled={saving}
              status={passwordError ? 'error' : undefined}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              onPressEnter={() => void handleConfirmPasswordAndSave()}
            />
            {passwordError && (
              <div style={{ color: '#EF4444', fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>
                {passwordError}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
