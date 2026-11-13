import { Button } from 'antd';

export default function DashboardResourceError({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return <div className="dm-resource-error" role="alert">
    <span>{message}</span>
    <Button type="link" onClick={() => void onRetry()}>Thử lại</Button>
  </div>;
}
