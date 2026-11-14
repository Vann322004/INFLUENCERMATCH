import { Alert, Button, Empty, Spin, Tag } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import apiClient from '../../services/apiClient';
import type { UserProfileResponse } from '../../types/api/auth.types';
import type { CampaignStatus } from '../../types/api/campaign.types';
import type { CollaborationStatus } from '../../types/api/collaboration.types';
import type { ApiProblemDetails, ApiResponse } from '../../types/api/common.types';

export const isUuid = (value: string) => /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
export const canReadHistory = (user: UserProfileResponse | null | undefined) => user?.role === 'BRAND'
  && user.status === 'ACTIVE' && user.permissions?.includes('VIEW_OWN_CAMPAIGN') === true
  && user.permissions.includes('VIEW_OWN_HISTORY_AND_INSIGHTS');

export async function readHistoryUser(signal: AbortSignal): Promise<UserProfileResponse> {
  return (await apiClient.get<ApiResponse<UserProfileResponse>>('/auth/me', { signal })).data.data;
}

export const campaignStates: Record<CampaignStatus, [string, string]> = {
  DRAFT: ['Bản nháp', 'default'], READY_FOR_DISCOVERY: ['Sẵn sàng tìm Creator', 'cyan'],
  ACTIVE: ['Đang hoạt động', 'blue'], COMPLETED: ['Đã hoàn tất', 'green'], ARCHIVED: ['Đã lưu trữ', 'default'],
};

export const collaborationStates: Record<CollaborationStatus, [string, string]> = {
  PLANNED: ['Đã lên kế hoạch', 'default'], IN_PROGRESS: ['Đang thực hiện', 'blue'],
  AWAITING_REVIEW: ['Chờ đánh giá cuối', 'orange'], COMPLETED: ['Đã hoàn tất', 'green'], CANCELLED: ['Đã hủy', 'red'],
};

export const deliverableStates: Record<string, [string, string]> = {
  PENDING: ['Chờ nộp', 'default'], SUBMITTED: ['Chờ duyệt', 'orange'],
  CHANGES_REQUESTED: ['Yêu cầu sửa', 'red'], APPROVED: ['Đã duyệt', 'green'],
};

export const historyDate = (value?: string | null, time = false) => value && dayjs(value).isValid()
  ? dayjs(value).format(time ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY') : '—';

export const historyNumber = (value?: number | null) => value == null ? '—'
  : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 }).format(value);

export function historyMoney(value?: number | null, unit?: string | null) {
  return value == null ? '—' : [historyNumber(value), unit].filter(Boolean).join(' ');
}

export function provenanceLabel(source?: string | null) {
  switch (source) {
    case 'SELF_REPORTED': return 'Số liệu tự khai';
    case 'LEGACY_SNAPSHOT':
    case 'LEGACY_UNVERIFIED':
    case 'LEGACY': return 'Dữ liệu lịch sử chưa kiểm chứng';
    case 'CREATOR_PORTAL': return 'Creator nộp qua Portal';
    case 'BRAND_EXTERNAL': return 'Brand ghi nhận từ bên ngoài';
    case 'CURRENT_PROFILE': return 'Thông tin kênh hiện tại';
    case 'CURRENT_CAMPAIGN_RECORD': return 'Thông tin chiến dịch hiện tại';
    case 'CURRENT_RECORD_FALLBACK': return 'Thông tin chiến dịch hiện tại do thiếu bản lưu';
    case 'CURRENT_DRAFT': return 'Bản nháp hiện tại';
    case 'BRIEF_SNAPSHOT':
    case 'CONTEXT_SNAPSHOT': return 'Bản lưu brief';
    case 'CONFIRMED_PROPOSAL': return 'Đề xuất đã chốt';
    case 'VERIFIED_CRAWL': return 'Số liệu được crawler kiểm chứng';
    default: return source || 'Chưa rõ nguồn';
  }
}

export function StatusTag({ state, labels }: { state: string; labels: Record<string, [string, string]> }) {
  const [label, color] = labels[state] ?? [state, 'default'];
  return <Tag color={color}>{label}</Tag>;
}

export function EvidenceLink({ url, label }: { url?: string | null; label: string }) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) {
      return <a href={parsed.href} target="_blank" rel="noopener noreferrer">{label}</a>;
    }
  } catch { /* Link lịch sử có thể thiếu hoặc sai định dạng. */ }
  return <span className="history-muted">Link đã lưu không mở được an toàn</span>;
}

export function problem(error: unknown) {
  return axios.isAxiosError<ApiProblemDetails>(error)
    ? { status: error.response?.status, data: error.response?.data as
      (ApiProblemDetails & { fieldErrors?: Record<string, string[]> }) | undefined } : {};
}

type ReadResult<T> = { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; data: T };

export function useHistoryRead<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [request, setRequest] = useState<{ load: typeof load; result: ReadResult<T> }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setRequest({ load, result: { status: 'loading' } });
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setRequest({ load, result: { status: 'ready', data } });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setRequest({ load, result: { status: 'error', error } });
    });
    return () => controller.abort();
  }, [load, attempt]);
  return {
    result: request?.load === load ? request.result : { status: 'loading' as const },
    retry: () => setAttempt(value => value + 1),
  };
}

export function HistoryReadState({ result, retry, missing = 'Không tìm thấy dữ liệu lịch sử.' }: {
  result: { status: 'loading' } | { status: 'error'; error: unknown }; retry: () => void; missing?: string;
}) {
  if (result.status === 'loading') return <div className="history-loading"><Spin description="Đang tải dữ liệu lịch sử" /></div>;
  const { status, data } = problem(result.error);
  if (status === 404) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={missing} />;
  if (status === 403) return <Alert showIcon type="warning" title="Bạn không có quyền xem dữ liệu lịch sử này." />;
  if (status === 401) return <Alert showIcon type="warning" title="Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." />;
  return <Alert showIcon type="error" title="Không tải được dữ liệu lịch sử."
    description={status === 400 ? data?.detail ?? 'Bộ lọc không hợp lệ.' : undefined}
    action={<Button size="small" onClick={retry}>Thử lại</Button>} />;
}
