import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Tag, Avatar, Button, Input, Select, Space,
  Drawer, Descriptions, Modal, Form, Badge,
  Typography, Tooltip, Tabs, Spin, Alert, Divider,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  SearchOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, StopOutlined, IdcardOutlined, LinkOutlined,
  ClockCircleOutlined, SafetyCertificateOutlined, FileSearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { claimService } from "../../../services/api/claimService";
import type { ClaimResponse, ClaimStatus } from "../../../types/api/claim.types";

const { Text, Title } = Typography;
const { TextArea } = Input;

const STATUS_CFG: Record<ClaimStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Cho duyet",  color: "#F59E0B", icon: <ClockCircleOutlined /> },
  APPROVED: { label: "Da duyet",   color: "#10B981", icon: <CheckCircleOutlined /> },
  REJECTED: { label: "Tu choi",    color: "#EF4444", icon: <CloseCircleOutlined /> },
  REVOKED:  { label: "Thu hoi",    color: "#64748B", icon: <StopOutlined /> },
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

  useEffect(() => {
    if (open && claim?.id) {
      setLoading(true);
      claimService.getClaimById(claim.id)
        .then(setDetail)
        .catch(() => setDetail(claim))
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
    }
  }, [open, claim]);

  const d = detail || claim;
  if (!d) return null;
  const st = STATUS_CFG[d.status];

  return (
    <Drawer
      open={open} onClose={onClose} width={600}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FileSearchOutlined style={{ color: "#6366F1", fontSize: 18 }} />
          <span style={{ fontWeight: 700 }}>Chi tiet Claim</span>
          <Tag icon={st.icon} style={{ background: st.color + "18", border: `1px solid ${st.color}40`, color: st.color, borderRadius: 20, fontWeight: 700, fontSize: 11 }}>
            {st.label}
          </Tag>
        </div>
      }
      destroyOnClose
      footer={
        d.status === "PENDING" ? (
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<CloseCircleOutlined />} onClick={() => { onClose(); onReject(d); }}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontWeight: 700 }}>
              Tu choi
            </Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { onClose(); onApprove(d); }}
              style={{ background: "linear-gradient(135deg,#10B981,#059669)", border: "none", fontWeight: 700 }}>
              Duyet Claim
            </Button>
          </Space>
        ) : d.status === "APPROVED" ? (
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<StopOutlined />} onClick={() => { onClose(); onRevoke(d); }}
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontWeight: 700 }}>
              Thu hoi quyen
            </Button>
          </Space>
        ) : null
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card size="small" bordered={false}
            style={{ background: "linear-gradient(135deg,#EEF2FF,#F0FDF4)", border: "1px solid #C7D2FE", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar src={d.creatorAvatar} size={48} icon={<UserOutlined />}
                style={{ border: "2px solid #818CF8", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>
                  {d.creatorName || d.creatorHandle || "Creator"}
                </div>
                <div style={{ color: "#6366F1", fontSize: 12, fontWeight: 600 }}>{d.creatorHandle}</div>
                {d.creatorFollowers && (
                  <div style={{ color: "#64748B", fontSize: 11 }}>{d.creatorFollowers.toLocaleString()} followers</div>
                )}
              </div>
            </div>
          </Card>

          <div>
            <Title level={5} style={{ color: "#334155", marginBottom: 10, fontSize: 13 }}>Nguoi gui yeu cau Claim</Title>
            <Descriptions column={2} size="small" bordered
              labelStyle={{ color: "#64748B", fontSize: 12 }}
              contentStyle={{ color: "#0F172A", fontWeight: 600, fontSize: 12 }}>
              <Descriptions.Item label="Ten">{d.claimantName || "—"}</Descriptions.Item>
              <Descriptions.Item label="Email">{d.claimantEmail || "—"}</Descriptions.Item>
              <Descriptions.Item label="Ngay gui" span={2}>
                {d.submittedAt ? new Date(d.submittedAt).toLocaleString("vi-VN") : "—"}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Divider style={{ margin: "4px 0" }} />

          <div>
            <Title level={5} style={{ color: "#334155", marginBottom: 10, fontSize: 13 }}>Bang chung (Evidence)</Title>
            {d.evidenceType || d.evidenceUrl || d.evidenceNote ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {d.evidenceType && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <IdcardOutlined style={{ color: "#6366F1" }} />
                    <Text style={{ fontSize: 13 }}>Loai: <strong>{d.evidenceType}</strong></Text>
                  </div>
                )}
                {d.evidenceUrl && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <LinkOutlined style={{ color: "#6366F1" }} />
                    <a href={d.evidenceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#6366F1" }}>
                      {d.evidenceUrl}
                    </a>
                  </div>
                )}
                {d.evidenceNote && (
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                    {d.evidenceNote}
                  </div>
                )}
              </div>
            ) : (
              <Alert message="Khong co bang chung dinh kem" type="warning" showIcon />
            )}
          </div>

          {(d.status === "REJECTED" || d.status === "REVOKED") && d.reason && (
            <>
              <Divider style={{ margin: "4px 0" }} />
              <Alert type={d.status === "REVOKED" ? "error" : "warning"} showIcon
                message={d.status === "REVOKED" ? "Ly do thu hoi" : "Ly do tu choi"}
                description={d.reason}
              />
            </>
          )}
          {d.status === "APPROVED" && (
            <>
              <Divider style={{ margin: "4px 0" }} />
              <Alert type="success" showIcon message="Claim da duoc duyet"
                description={`Duyet boi: ${d.reviewedBy || "Admin"} luc ${d.reviewedAt ? new Date(d.reviewedAt).toLocaleString("vi-VN") : "—"}`}
              />
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}

function ApproveModal({ claim, open, onClose, onDone }: { claim: ClaimResponse | null; open: boolean; onClose: () => void; onDone: (u: ClaimResponse) => void }) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    if (!claim) return;
    try {
      setLoading(true);
      const updated = await claimService.reviewClaim(claim.id, { approved: true, reason: "Approved by admin" });
      onDone(updated); onClose();
    } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={440}
      title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircleOutlined style={{ color: "#10B981", fontSize: 18 }} /><span style={{ fontWeight: 700 }}>Xac nhan Duyet Claim</span></div>}>
      <div style={{ padding: "8px 0" }}>
        <Alert type="success" showIcon message="Hanh dong nay se xac minh quyen so huu cua creator." style={{ marginBottom: 16 }} />
        {claim && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 10, marginBottom: 16 }}>
            <Avatar src={claim.creatorAvatar} icon={<UserOutlined />} size={40} />
            <div>
              <div style={{ fontWeight: 700, color: "#0F172A" }}>{claim.creatorName || claim.creatorHandle}</div>
              <div style={{ fontSize: 12, color: "#064E3B" }}>{claim.claimantEmail}</div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Huy</Button>
          <Button loading={loading} onClick={handleConfirm}
            style={{ background: "linear-gradient(135deg,#10B981,#059669)", border: "none", color: "#fff", fontWeight: 700 }}>
            Xac nhan Duyet
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({ claim, open, onClose, onDone }: { claim: ClaimResponse | null; open: boolean; onClose: () => void; onDone: (u: ClaimResponse) => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    if (!claim) return;
    try {
      const values = await form.validateFields();
      setLoading(true);
      const updated = await claimService.reviewClaim(claim.id, { approved: false, reason: values.reason });
      onDone(updated); onClose(); form.resetFields();
    } catch { } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={480}
      title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><CloseCircleOutlined style={{ color: "#EF4444", fontSize: 18 }} /><span style={{ fontWeight: 700 }}>Tu choi Claim</span></div>}>
      <Alert type="error" showIcon message="Claim se bi tu choi va creator khong nhan duoc quyen so huu." style={{ margin: "12px 0 16px" }} />
      <Form form={form} layout="vertical">
        <Form.Item name="reason" label="Ly do tu choi *" rules={[{ required: true, message: "Vui long nhap ly do tu choi" }]}>
          <TextArea rows={4} placeholder="Bang chung khong du thuyet phuc / Thong tin khong khop / ..." style={{ resize: "none" }} />
        </Form.Item>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Huy</Button>
          <Button loading={loading} onClick={handleConfirm}
            style={{ background: "#EF4444", border: "none", color: "#fff", fontWeight: 700 }}>
            Xac nhan Tu choi
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
      onDone(updated); onClose(); form.resetFields();
    } catch { } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={480}
      title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><StopOutlined style={{ color: "#EF4444", fontSize: 18 }} /><span style={{ fontWeight: 700 }}>Thu hoi quyen Claim</span></div>}>
      <Alert type="error" showIcon message="Thu hoi se xoa quyen so huu va an rate card cua creator nay." style={{ margin: "12px 0 16px" }} />
      <Form form={form} layout="vertical">
        <Form.Item name="reason" label="Ly do thu hoi *" rules={[{ required: true, message: "Vui long nhap ly do thu hoi" }]}>
          <TextArea rows={4} placeholder="Phat hien gian lan / Mat quyen so huu kenh / ..." style={{ resize: "none" }} />
        </Form.Item>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Huy</Button>
          <Button loading={loading} onClick={handleConfirm}
            style={{ background: "#EF4444", border: "none", color: "#fff", fontWeight: 700 }}>
            Xac nhan Thu hoi
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function CreatorClaimReviewPage() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "ALL">("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimResponse | null>(null);
  const [approveTarget, setApproveTarget] = useState<ClaimResponse | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ClaimResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ClaimResponse | null>(null);

  const fetchClaims = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const statusParam = tab === "pending" ? "PENDING" : statusFilter !== "ALL" ? statusFilter : undefined;
      const res = await claimService.getClaims({ status: statusParam as any, page: p - 1, size: 10 });
      const list = res.items ?? res.content ?? (Array.isArray(res) ? res : []);
      setClaims(list);
      setTotal(res.totalElements ?? list.length);
    } catch { setClaims([]); } finally { setLoading(false); }
  }, [tab, statusFilter]);

  useEffect(() => { setPage(1); fetchClaims(1); }, [tab, statusFilter]);
  useEffect(() => { if (page > 1) fetchClaims(page); }, [page]);

  const handleActionDone = (updated: ClaimResponse) => {
    setClaims(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const filtered = search
    ? claims.filter(c => (c.creatorName || "").toLowerCase().includes(search.toLowerCase()) || (c.creatorHandle || "").toLowerCase().includes(search.toLowerCase()) || (c.claimantEmail || "").toLowerCase().includes(search.toLowerCase()))
    : claims;

  const pendingCount = claims.filter(c => c.status === "PENDING").length;

  const columns: TableColumnsType<ClaimResponse> = [
    {
      title: "Creator", key: "creator", width: 200,
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={r.creatorAvatar} icon={<UserOutlined />} size={36} style={{ border: "1.5px solid rgba(99,102,241,0.3)", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", lineHeight: 1.2 }}>{r.creatorName || r.creatorHandle || "Creator"}</div>
            <div style={{ fontSize: 11, color: "#6366F1" }}>{r.creatorHandle}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Nguoi claim", key: "claimant", width: 180,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12, color: "#334155" }}>{r.claimantName || "—"}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>{r.claimantEmail || "—"}</div>
        </div>
      ),
    },
    {
      title: "Platform", dataIndex: "creatorPlatform", key: "platform", width: 100,
      render: (v: string) => v ? <Tag style={{ borderRadius: 12, fontWeight: 600, fontSize: 11 }}>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Ngay gui", dataIndex: "submittedAt", key: "submittedAt", width: 130,
      render: (v: string) => <Text style={{ fontSize: 12, color: "#64748B" }}>{v ? new Date(v).toLocaleDateString("vi-VN") : "—"}</Text>,
    },
    {
      title: "Trang thai", dataIndex: "status", key: "status", width: 120,
      render: (status: ClaimStatus) => {
        const cfg = STATUS_CFG[status];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Badge color={cfg.color} />
            <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{cfg.label}</span>
          </div>
        );
      },
    },
    {
      title: "Thao tac", key: "actions", width: 160,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Xem bang chung">
            <Button size="small" icon={<EyeOutlined />}
              onClick={e => { e.stopPropagation(); setSelectedClaim(record); setDrawerOpen(true); }}
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818CF8" }} />
          </Tooltip>
          {record.status === "PENDING" && (
            <>
              <Tooltip title="Duyet">
                <Button size="small" icon={<CheckCircleOutlined />}
                  onClick={e => { e.stopPropagation(); setApproveTarget(record); }}
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }} />
              </Tooltip>
              <Tooltip title="Tu choi">
                <Button size="small" icon={<CloseCircleOutlined />}
                  onClick={e => { e.stopPropagation(); setRejectTarget(record); }}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }} />
              </Tooltip>
            </>
          )}
          {record.status === "APPROVED" && (
            <Tooltip title="Thu hoi">
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
      <Table
        columns={columns} dataSource={filtered} rowKey="id" size="middle"
        pagination={{ current: page, pageSize: 10, total, onChange: setPage, showTotal: t => `${t} claims` }}
        onRow={record => ({ onClick: () => { setSelectedClaim(record); setDrawerOpen(true); }, style: { cursor: "pointer" } })}
      />
    </Spin>
  );

  const filterBar = (showStatus = false) => (
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <Input prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
        placeholder="Tim theo ten creator, email..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 340, borderRadius: 8 }} allowClear />
      {showStatus && (
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
          <Select.Option value="ALL">Tat ca trang thai</Select.Option>
          <Select.Option value="APPROVED">Da duyet</Select.Option>
          <Select.Option value="REJECTED">Tu choi</Select.Option>
          <Select.Option value="REVOKED">Thu hoi</Select.Option>
        </Select>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ color: "#0F172A", fontWeight: 800, fontSize: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <SafetyCertificateOutlined style={{ color: "#6366F1" }} />
            Duyet Creator Claim
          </div>
          <div style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>
            Xet duyet yeu cau xac minh quyen so huu kenh creator
          </div>
        </div>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <Tabs activeKey={tab} onChange={v => { setTab(v as "pending" | "history"); setSearch(""); }}
          type="line"
          tabBarStyle={{ padding: "0 20px", marginBottom: 0, borderBottom: "1px solid #EEF0F6" }}
          items={[
            {
              key: "pending",
              label: (
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <ClockCircleOutlined />
                  Cho duyet
                  {pendingCount > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {pendingCount}
                    </span>
                  )}
                </span>
              ),
              children: <div style={{ padding: "16px 20px 20px" }}>{filterBar(false)}{tableContent}</div>,
            },
            {
              key: "history",
              label: (
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <FileSearchOutlined />
                  Lich su
                </span>
              ),
              children: <div style={{ padding: "16px 20px 20px" }}>{filterBar(true)}{tableContent}</div>,
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
