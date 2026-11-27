import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card, Table, Tag, Avatar, Button, Input, Select, Space,
  Drawer, Descriptions, Modal, Form, Badge, message,
  Typography, Tooltip, Tabs, Spin, Alert, Divider, Grid, Pagination, Empty,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  SearchOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, StopOutlined, IdcardOutlined, LinkOutlined,
  ClockCircleOutlined, FileSearchOutlined,
  UserOutlined, ReloadOutlined,
} from "@ant-design/icons";
import { claimService } from "../../../services/api/claimService";
import type { ClaimResponse, ClaimStatus, ReviewRequest, ReviewEvidenceType } from "../../../types/api/claim.types";
import { getErrorMessage } from "../../../services/apiClient";
import "./CreatorClaimReviewPage.css";

const { Text, Title } = Typography;
const { TextArea } = Input;
const reviewEvidenceLabels: Record<ReviewEvidenceType, string> = {
  ACCOUNT_SETTINGS: 'Trang quản lý/cài đặt',
  SCREEN_SHARE: 'Chia sẻ màn hình',
  OTHER: 'Khác',
  NO_VALID_EVIDENCE: 'Chưa có bằng chứng hợp lệ',
};
type ReviewFields = Omit<ReviewRequest, 'approved'>;

function ReviewEvidenceFields({ approving }: { approving: boolean }) {
  const types = Object.keys(reviewEvidenceLabels) as ReviewEvidenceType[];
  return <>
    <Form.Item name="reviewEvidenceType" label="Loại bằng chứng đã xem"
      rules={[{ required: true, message: 'Chọn loại bằng chứng.' }]}>
      <Select options={types.filter(value => !approving || value !== 'NO_VALID_EVIDENCE')
        .map(value => ({ value, label: reviewEvidenceLabels[value] }))} />
    </Form.Item>
    <Form.Item name="reviewVerificationNote" label="Cách đối chiếu"
      rules={[{ required: true, whitespace: true, message: 'Ghi cách bạn đã đối chiếu bằng chứng.' }]}>
      <TextArea rows={3} maxLength={2000}
        placeholder="Ví dụ: Đối chiếu mã kênh và quyền quản lý trên trang cài đặt qua chia sẻ màn hình." />
    </Form.Item>
    <Form.Item name="reason" label={approving ? 'Lý do duyệt' : 'Lý do từ chối'}
      rules={[{ required: true, whitespace: true, message: 'Nhập lý do quyết định.' }]}>
      <TextArea rows={3} maxLength={2000} showCount />
    </Form.Item>
  </>;
}

function actionError(error: any, fallback: string) {
  return error?.response?.status === 409
    ? 'Hồ sơ hoặc quyền sở hữu đã thay đổi. Hãy tải lại danh sách trước khi quyết định.'
    : getErrorMessage(error, fallback);
}

function ownershipResult(claim: ClaimResponse) {
  if (claim.linkedToClaimant === undefined) return null;
  return claim.linkedToClaimant
    ? claim.verification?.status === 'VERIFIED'
      ? 'Kênh vẫn liên kết với người gửi và còn bằng chứng xác minh hợp lệ.'
      : 'Kênh vẫn liên kết với người gửi; chưa có kết quả xác minh hợp lệ.'
    : 'Kênh hiện không liên kết với người gửi yêu cầu này.';
}

const STATUS_CFG: Record<ClaimStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Chờ duyệt",  color: "#F59E0B", icon: <ClockCircleOutlined /> },
  APPROVED: { label: "Đã duyệt",   color: "#10B981", icon: <CheckCircleOutlined /> },
  REJECTED: { label: "Từ chối",    color: "#EF4444", icon: <CloseCircleOutlined /> },
  REVOKED:  { label: "Thu hồi",    color: "#64748B", icon: <StopOutlined /> },
};

function ClaimDetailDrawer({
  claim, open, onClose, onApprove, onReject, onRevoke,
}: {
  claim: ClaimResponse | null; open: boolean; onClose: () => void;
  onApprove: (c: ClaimResponse) => void;
  onReject: (c: ClaimResponse) => void;
  onRevoke: (c: ClaimResponse) => void;
}) {
  const [detail, setDetail] = useState<ClaimResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setDetail(null);
    setDetailError(false);
    if (open && claim?.id) {
      setLoading(true);
      claimService.getClaimById(claim.id)
        .then(value => { if (active) setDetail(value); })
        .catch(() => { if (active) setDetailError(true); })
        .finally(() => { if (active) setLoading(false); });
    } else {
      setDetail(null);
    }
    return () => { active = false; };
  }, [open, claim, retry]);

  const d = detail || claim;
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  if (!d) return null;
  const st = STATUS_CFG[d.status];

  return (
    <Drawer
      open={open} onClose={onClose} width={isMobile ? "100vw" : 600}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FileSearchOutlined style={{ color: "#7C3AED", fontSize: 18 }} />
          <span style={{ fontWeight: 700 }}>Chi tiết hồ sơ xác minh</span>
          <Tag icon={st.icon} style={{ background: st.color + "18", border: `1px solid ${st.color}40`, color: st.color, borderRadius: 20, fontWeight: 700, fontSize: 11 }}>
            {st.label}
          </Tag>
        </div>
      }
      destroyOnClose
      footer={
        !detail || loading || detailError ? null : d.status === "PENDING" ? (
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<CloseCircleOutlined />} onClick={() => { onClose(); onReject(d); }}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontWeight: 700 }}>
              Từ chối
            </Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { onClose(); onApprove(d); }}
              style={{ background: "linear-gradient(135deg,#10B981,#059669)", border: "none", fontWeight: 700 }}>
              Duyệt yêu cầu
            </Button>
          </Space>
        ) : d.status === "APPROVED" ? (
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<StopOutlined />} onClick={() => { onClose(); onRevoke(d); }}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontWeight: 700 }}>
              Thu hồi bằng chứng
            </Button>
          </Space>
        ) : null
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
      ) : detailError ? <Alert type="error" title="Không tải được bằng chứng" description="Hãy tải lại hồ sơ trước khi quyết định." action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card size="small" bordered={false}
            style={{ background: "linear-gradient(135deg,#F3E8FF,#F0FDF4)", border: "1px solid #DDD6FE", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar src={d.creatorAvatar} size={48} icon={<UserOutlined />}
                style={{ border: "2px solid #8B5CF6", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>
                  {d.creatorName || d.creatorHandle || "Creator"}
                </div>
                <div style={{ color: "#7C3AED", fontSize: 12, fontWeight: 600 }}>{d.creatorHandle}</div>
                {d.creatorFollowers && (
                  <div style={{ color: "#64748B", fontSize: 11 }}>{d.creatorFollowers.toLocaleString()} followers</div>
                )}
              </div>
            </div>
          </Card>

          <div>
            <Title level={5} style={{ color: "#334155", marginBottom: 10, fontSize: 13 }}>Người gửi yêu cầu xác minh</Title>
            <Descriptions column={isMobile ? 1 : 2} size="small" bordered
              labelStyle={{ color: "#64748B", fontSize: 12 }}
              contentStyle={{ color: "#0F172A", fontWeight: 600, fontSize: 12 }}>
              <Descriptions.Item label="Họ và tên">{d.claimantName || "—"}</Descriptions.Item>
              <Descriptions.Item label="Email">{d.claimantEmail || "—"}</Descriptions.Item>
              <Descriptions.Item label="Ngày gửi" span={2}>
                {d.submittedAt ? new Date(d.submittedAt).toLocaleString("vi-VN") : "—"}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Divider style={{ margin: "4px 0" }} />

          <div>
            <Title level={5} style={{ color: "#334155", marginBottom: 10, fontSize: 13 }}>Minh chứng xác thực (Evidence)</Title>
            {d.evidenceType || d.evidenceUrl || d.evidenceNote ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {d.evidenceType && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <IdcardOutlined style={{ color: "#7C3AED" }} />
                    <Text style={{ fontSize: 13 }}>Loại: <strong>{d.evidenceType}</strong></Text>
                  </div>
                )}
                {(d.evidenceUrls?.length ? d.evidenceUrls : d.evidenceUrl ? [d.evidenceUrl] : []).map(url => (
                  <div key={url} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <LinkOutlined style={{ color: "#7C3AED" }} />
                    <a key={url} href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#7C3AED", overflowWrap: "anywhere" }}>
                      {url}
                    </a>
                  </div>
                ))}
                {d.evidenceNote && (
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                    {d.evidenceNote}
                  </div>
                )}
              </div>
            ) : (
              <Alert message="Không có bằng chứng đính kèm" type="warning" showIcon />
            )}
          </div>

          {d.cooperationInvitationId && <Text type="secondary">Mã lời mời hợp tác · {d.cooperationInvitationId}</Text>}
          {d.reviewedAt && <Descriptions title="Quyết định xét duyệt" size="small" column={1}>
            <Descriptions.Item label="Người xét duyệt">{d.reviewedBy || 'Chưa ghi nhận'}</Descriptions.Item>
            <Descriptions.Item label="Thời điểm">{new Date(d.reviewedAt).toLocaleString('vi-VN')}</Descriptions.Item>
            <Descriptions.Item label="Loại bằng chứng">
              {d.reviewEvidenceType ? reviewEvidenceLabels[d.reviewEvidenceType] : 'Chưa ghi nhận'}
            </Descriptions.Item>
            <Descriptions.Item label="Cách đối chiếu">{d.reviewVerificationNote || 'Chưa ghi nhận'}</Descriptions.Item>
            <Descriptions.Item label="Lý do quyết định">{d.reason || 'Chưa ghi nhận'}</Descriptions.Item>
          </Descriptions>}
          {d.status === "REVOKED" && d.revokeReason &&
            <Alert type="error" showIcon title="Lý do thu hồi" description={d.revokeReason} />}
          {ownershipResult(d) && <Alert type="info" showIcon title="Liên kết kênh hiện tại"
            description={ownershipResult(d)} />}
        </div>
      )}
    </Drawer>
  );
}

function ApproveModal({ claim, open, onClose, onDone }: { claim: ClaimResponse | null; open: boolean; onClose: () => void; onDone: (u: ClaimResponse) => void }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ReviewFields>();
  useEffect(() => { if (open) form.resetFields(); }, [open, claim?.id, form]);
  const handleConfirm = async (values: ReviewFields) => {
    if (!claim) return;
    try {
      setLoading(true);
      const updated = await claimService.reviewClaim(claim.id, {
        approved: true,
        ...values,
      });
      message.success("Đã ghi nhận quyết định xác minh quyền sở hữu kênh.");
      onDone(updated); onClose();
    } catch (err: any) {
      message.error(actionError(err, 'Chưa xác nhận được kết quả duyệt. Hãy tải lại hồ sơ trước khi thử lại.'));
      if (err?.response?.status === 409) { onDone(claim); onClose(); }
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={440}
      title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircleOutlined style={{ color: "#10B981", fontSize: 18 }} /><span style={{ fontWeight: 700 }}>Xác nhận duyệt yêu cầu</span></div>}>
      <div style={{ padding: "8px 0" }}>
        <Alert type="success" showIcon message="Hành động này sẽ xác minh quyền sở hữu của nhà sáng tạo." style={{ marginBottom: 16 }} />
        {claim && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 10, marginBottom: 16 }}>
            <Avatar src={claim.creatorAvatar} icon={<UserOutlined />} size={40} />
            <div>
              <div style={{ fontWeight: 700, color: "#0F172A" }}>{claim.creatorName || claim.creatorHandle}</div>
              <div style={{ fontSize: 12, color: "#064E3B" }}>{claim.claimantEmail}</div>
            </div>
          </div>
        )}
        <Form form={form} layout="vertical" disabled={loading} onFinish={handleConfirm}>
        <ReviewEvidenceFields approving />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button loading={loading} htmlType="submit"
            style={{ background: "linear-gradient(135deg,#10B981,#059669)", border: "none", color: "#fff", fontWeight: 700 }}>
            Xác nhận duyệt
          </Button>
        </div>
        </Form>
      </div>
    </Modal>
  );
}

function RejectModal({ claim, open, onClose, onDone }: { claim: ClaimResponse | null; open: boolean; onClose: () => void; onDone: (u: ClaimResponse) => void }) {
  const [form] = Form.useForm<ReviewFields>();
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (open) form.resetFields(); }, [open, claim?.id, form]);
  const handleConfirm = async (values: ReviewFields) => {
    if (!claim) return;
    try {
      setLoading(true);
      const updated = await claimService.reviewClaim(claim.id, { approved: false, ...values });
      message.success("Đã từ chối đơn claim.");
      onDone(updated); onClose(); form.resetFields();
    } catch (err: any) {
      message.error(actionError(err, 'Chưa xác nhận được kết quả từ chối. Hãy tải lại hồ sơ trước khi thử lại.'));
      if (err?.response?.status === 409) { onDone(claim); onClose(); }
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={480}
      title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><CloseCircleOutlined style={{ color: "#EF4444", fontSize: 18 }} /><span style={{ fontWeight: 700 }}>Từ chối yêu cầu</span></div>}>
      <Alert type="error" showIcon message="Yêu cầu sẽ bị từ chối và nhà sáng tạo không nhận được quyền sở hữu." style={{ margin: "12px 0 16px" }} />
      <Form form={form} layout="vertical" disabled={loading} onFinish={handleConfirm}>
        <ReviewEvidenceFields approving={false} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button loading={loading} htmlType="submit"
            style={{ background: "#EF4444", border: "none", color: "#fff", fontWeight: 700 }}>
            Xác nhận từ chối
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

function RevokeModal({ claim, open, onClose, onDone }: { claim: ClaimResponse | null; open: boolean; onClose: () => void; onDone: (u: ClaimResponse) => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    if (!claim) return;
    try {
      const values = await form.validateFields();
      setLoading(true);
      const updated = await claimService.revokeClaim(claim.id, { reason: values.reason });
      message.success(updated.linkedToClaimant === true
        ? 'Đã thu hồi bằng chứng thủ công. Kênh vẫn còn liên kết.'
        : updated.linkedToClaimant === false ? 'Đã thu hồi bằng chứng và tháo liên kết với người gửi.'
        : 'Đã thu hồi bằng chứng thủ công. Hãy kiểm tra lại liên kết kênh.');
      onDone(updated); onClose(); form.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(actionError(err, 'Chưa xác nhận được kết quả thu hồi. Hãy tải lại hồ sơ trước khi thử lại.'));
      if (err?.response?.status === 409) { onDone(claim); onClose(); }
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={480}
      title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><StopOutlined style={{ color: "#EF4444", fontSize: 18 }} /><span style={{ fontWeight: 700 }}>Thu hồi bằng chứng thủ công</span></div>}>
      <Alert type="warning" showIcon message="Bằng chứng thủ công của đơn này sẽ bị thu hồi. Quyền sở hữu được giữ nếu kênh còn bằng chứng xác minh độc lập hợp lệ." style={{ margin: "12px 0 16px" }} />
      <Form form={form} layout="vertical">
        <Form.Item name="reason" label="Lý do thu hồi *" rules={[{ required: true, message: "Vui lòng nhập lý do thu hồi" }]}>
          <TextArea rows={4} placeholder="Phát hiện gian lận / Mất quyền sở hữu kênh / ..." style={{ resize: "none" }} />
        </Form.Item>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button loading={loading} onClick={handleConfirm}
            style={{ background: "#EF4444", border: "none", color: "#fff", fontWeight: 700 }}>
            Xác nhận thu hồi
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function CreatorClaimReviewPage() {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [serverSearch, setServerSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setServerSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "ALL">("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimResponse | null>(null);
  const [approveTarget, setApproveTarget] = useState<ClaimResponse | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ClaimResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ClaimResponse | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const loadVersion = useRef(0);

  const fetchClaims = useCallback(async (p = 1) => {
    const version = ++loadVersion.current;
    try {
      setLoading(true);
      setLoadError(null);
      const statusParam = tab === "pending" ? "PENDING" : statusFilter !== "ALL" ? statusFilter : undefined;
      const res = await claimService.getClaims({ status: statusParam as any, page: p - 1, size: 10, q: serverSearch || undefined });
      if (version !== loadVersion.current) return;
      const list = res.items ?? res.content ?? (Array.isArray(res) ? res : []);
      setClaims(list);
      setTotal(res.totalElements ?? list.length);
    } catch (err: any) {
      if (version !== loadVersion.current) return;
      setClaims([]);
      setTotal(0);
      setLoadError(err?.response?.data?.message || err?.message || "Không kết nối được máy chủ.");
    } finally { if (version === loadVersion.current) setLoading(false); }
  }, [tab, statusFilter, serverSearch]);

  useEffect(() => { setPage(1); void fetchClaims(1); }, [fetchClaims]);

  const handleActionDone = (updated: ClaimResponse) => {
    void fetchClaims(page);
  };

  const filtered = claims;

  const pendingCount = claims.filter(c => c.status === "PENDING").length;

  const columns: TableColumnsType<ClaimResponse> = [
    {
      title: "Creator", key: "creator", ellipsis: true,
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar src={r.creatorAvatar} icon={<UserOutlined />} size={36} style={{ border: "1.5px solid rgba(124, 58, 237,0.3)", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.creatorName || r.creatorHandle || "Kênh chưa có tên"}
            </div>
            {!r.creatorName && !r.creatorHandle && <code style={{ overflowWrap: 'anywhere', fontSize: 11 }}>{r.creatorId}</code>}
            <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600 }}>{r.creatorHandle}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Người yêu cầu", key: "claimant", ellipsis: true,
      render: (_, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: "#334155", overflowWrap: 'anywhere' }}>{r.claimantName || r.claimantId || "—"}</div>
          <div style={{ fontSize: 11, color: "#64748B", overflowWrap: 'anywhere' }}>{r.claimantEmail || "—"}</div>
        </div>
      ),
    },
    {
      title: "Nền tảng", dataIndex: "creatorPlatform", key: "platform", width: 100,
      render: (v: string) => v ? <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700, marginInlineEnd: 0 }}>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Ngày gửi", dataIndex: "submittedAt", key: "submittedAt", width: 110,
      render: (v: string) => <Text style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>{v ? new Date(v).toLocaleDateString("vi-VN") : "—"}</Text>,
    },
    {
      title: "Trạng thái", dataIndex: "status", key: "status", width: 115,
      render: (status: ClaimStatus) => {
        const cfg = STATUS_CFG[status];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <Badge color={cfg.color} />
            <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{cfg.label}</span>
          </div>
        );
      },
    },
    {
      title: "Thao tác", key: "actions", width: 124,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Xem bằng chứng">
            <Button size="small" icon={<EyeOutlined />}
              onClick={e => { e.stopPropagation(); setSelectedClaim(record); setDrawerOpen(true); }}
              style={{ background: "#F3E8FF", border: "1px solid #DDD6FE", color: "#7C3AED" }} />
          </Tooltip>
          {record.status === "PENDING" && (
            <>
              <Tooltip title="Duyệt">
                <Button size="small" icon={<CheckCircleOutlined />}
                  onClick={e => { e.stopPropagation(); setApproveTarget(record); }}
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }} />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button size="small" icon={<CloseCircleOutlined />}
                  onClick={e => { e.stopPropagation(); setRejectTarget(record); }}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }} />
              </Tooltip>
            </>
          )}
          {record.status === "APPROVED" && (
            <Tooltip title="Thu hồi">
              <Button size="small" icon={<StopOutlined />}
                onClick={e => { e.stopPropagation(); setRevokeTarget(record); }}
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const tableContent = (
    <Spin spinning={loading}>
      {isMobile ? (
        filtered.length === 0 ? (
          <Empty description="Không có hồ sơ xác minh nào" />
        ) : (
          <div className="claims-mobile-list">
            {filtered.map((record) => {
              const cfg = STATUS_CFG[record.status];
              return (
                <div
                  key={record.id}
                  className="claims-mobile-card"
                  onClick={() => { setSelectedClaim(record); setDrawerOpen(true); }}
                >
                  <div className="claims-mobile-top">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Avatar src={record.creatorAvatar} icon={<UserOutlined />} size={36} style={{ border: "1.5px solid rgba(124, 58, 237,0.3)", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", wordBreak: "break-word" }}>
                          {record.creatorName || record.creatorHandle || "Kênh chưa có tên"}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#7C3AED", fontWeight: 600 }}>{record.creatorHandle}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                      <Badge color={cfg.color} />
                      <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{cfg.label}</span>
                    </div>
                  </div>
                  <div className="claims-mobile-meta">
                    {record.creatorPlatform && <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700, marginInlineEnd: 0 }}>{record.creatorPlatform}</Tag>}
                    <span>{record.claimantName || record.claimantEmail || "—"}</span>
                    <span>· {record.submittedAt ? new Date(record.submittedAt).toLocaleDateString("vi-VN") : "—"}</span>
                  </div>
                  <div className="claims-mobile-actions" onClick={e => e.stopPropagation()}>
                    <Button size="small" icon={<EyeOutlined />}
                      onClick={() => { setSelectedClaim(record); setDrawerOpen(true); }}
                      style={{ background: "#F3E8FF", border: "1px solid #DDD6FE", color: "#7C3AED" }}>
                      Xem
                    </Button>
                    {record.status === "PENDING" && (
                      <>
                        <Button size="small" icon={<CheckCircleOutlined />}
                          onClick={() => setApproveTarget(record)}
                          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}>
                          Duyệt
                        </Button>
                        <Button size="small" icon={<CloseCircleOutlined />}
                          onClick={() => setRejectTarget(record)}
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}>
                          Từ chối
                        </Button>
                      </>
                    )}
                    {record.status === "APPROVED" && (
                      <Button size="small" icon={<StopOutlined />}
                        onClick={() => setRevokeTarget(record)}
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}>
                        Thu hồi
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <Pagination
                current={page}
                pageSize={10}
                total={total}
                size="small"
                onChange={value => { setPage(value); void fetchClaims(value); }}
                showTotal={t => `${t} hồ sơ`}
              />
            </div>
          </div>
        )
      ) : (
        <Table
          columns={columns} dataSource={filtered} rowKey="id" size="middle"
          pagination={{ current: page, pageSize: 10, total, onChange: value => { setPage(value); void fetchClaims(value); }, showTotal: t => `${t} hồ sơ` }}
          onRow={record => ({ onClick: () => { setSelectedClaim(record); setDrawerOpen(true); }, style: { cursor: "pointer" } })}
        />
      )}
    </Spin>
  );

  const filterBar = (showStatus = false) => (
    <div className="claims-filter-bar">
      <Input prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
        placeholder="Tìm trong trang hiện tại theo kênh hoặc người yêu cầu"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: isMobile ? "100%" : 340, borderRadius: 8 }} allowClear />
      {showStatus && (
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: isMobile ? "100%" : 180 }}>
          <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
          <Select.Option value="APPROVED">Đã duyệt</Select.Option>
          <Select.Option value="REJECTED">Từ chối</Select.Option>
          <Select.Option value="REVOKED">Thu hồi</Select.Option>
        </Select>
      )}
    </div>
  );

  return (
    <div className="claims-review-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ color: "#0F172A", fontWeight: 800, fontSize: 22 }}>
            Kiểm duyệt quyền sở hữu kênh
          </div>
          <div style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>
            Đối chiếu bằng chứng, ghi nhận lý do và bảo vệ quyền sở hữu kênh trong InfluencerMatch.
          </div>
        </div>
        <Button
          icon={<ReloadOutlined spin={loading} />}
          onClick={() => void fetchClaims(page)}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Làm mới danh sách
        </Button>
      </div>

      <div className="dm-flow-highlights">
        <article><strong>Hai cách xác minh</strong><p>OAuth kiểm tra quyền quản lý qua nền tảng; bằng chứng thủ công được gửi vào hàng đợi xét duyệt.</p></article>
        <article><strong>Quyết định có căn cứ</strong><p>Xem bằng chứng và ghi rõ lý do duyệt, từ chối hoặc thu hồi. Đây không phải tích xanh của mạng xã hội.</p></article>
        <article><strong>Giữ dấu vết sở hữu</strong><p>BE lưu lịch sử xét duyệt; khi thu hồi, bằng chứng độc lập còn hiệu lực được kiểm tra trước khi bỏ liên kết.</p></article>
      </div>
      {loadError && (
        <Alert
          type="error" showIcon style={{ marginBottom: 16, borderRadius: 10 }}
          message="Không tải được danh sách đơn claim từ máy chủ"
          description={`${loadError} — Không hiển thị dữ liệu giả lập. Kiểm tra đăng nhập, CORS hoặc kết nối backend rồi thử lại.`}
          action={<Button size="small" onClick={() => fetchClaims(page)}>Thử lại</Button>}
        />
      )}

      <Card variant="borderless" className="claims-review-card" styles={{ body: { padding: 0 } }}>
        <Tabs activeKey={tab} onChange={v => { setTab(v as "pending" | "history"); setSearch(""); }}
          size="middle"
          tabBarStyle={{ padding: "0 20px", marginBottom: 0, borderBottom: "1px solid #EEF0F6", background: "#FAFAFD" }}
          items={[
            {
              key: "pending",
              label: (
                <span style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <ClockCircleOutlined />
                  Chờ duyệt
                  {pendingCount > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {pendingCount}
                    </span>
                  )}
                </span>
              ),
              children: <div className="claims-tab-body">{filterBar(false)}{tableContent}</div>,
            },
            {
              key: "history",
              label: (
                <span style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <FileSearchOutlined />
                  Lịch sử
                </span>
              ),
              children: <div className="claims-tab-body">{filterBar(true)}{tableContent}</div>,
            },
          ]}
        />
      </Card>

      <ClaimDetailDrawer claim={selectedClaim} open={drawerOpen} onClose={() => setDrawerOpen(false)}
        onApprove={c => { setDrawerOpen(false); setApproveTarget(c); }}
        onReject={c => { setDrawerOpen(false); setRejectTarget(c); }}
        onRevoke={c => { setDrawerOpen(false); setRevokeTarget(c); }}
      />
      <ApproveModal claim={approveTarget} open={!!approveTarget} onClose={() => setApproveTarget(null)} onDone={handleActionDone} />
      <RejectModal claim={rejectTarget} open={!!rejectTarget} onClose={() => setRejectTarget(null)} onDone={handleActionDone} />
      <RevokeModal claim={revokeTarget} open={!!revokeTarget} onClose={() => setRevokeTarget(null)} onDone={handleActionDone} />
    </div>
  );
}
