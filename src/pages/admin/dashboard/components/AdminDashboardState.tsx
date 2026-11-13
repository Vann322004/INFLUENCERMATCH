import { Button, Skeleton } from 'antd';
import type { AsyncResource } from '../../../../hooks/useAsyncResource';

export default function AdminDashboardState({ resource, allowed = true }: { resource: AsyncResource<unknown>; allowed?: boolean }) {
  if (!allowed) return <p className="ad-state">Bạn không có quyền xem dữ liệu này.</p>;
  if (resource.status === 'loading') return <div role="status" aria-label="Đang tải dữ liệu"><Skeleton active paragraph={{ rows: 1 }} title={false} /></div>;
  if (resource.status === 'error') return (
    <div className="ad-state" role="alert">
      <p>Không thể tải dữ liệu. Vui lòng thử lại.</p>
      <Button onClick={() => void resource.reload()}>Thử lại</Button>
    </div>
  );
  return null;
}
