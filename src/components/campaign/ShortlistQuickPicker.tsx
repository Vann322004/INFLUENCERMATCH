import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Empty, Modal, Select, Skeleton, Space } from 'antd';
import { shortlistService } from '../../services/api/shortlistService';
import { useAsyncResource } from '../../hooks/useAsyncResource';

export default function ShortlistQuickPicker({
  open,
  campaignId,
  selectedIds,
  onClose,
  onApply,
  confirmLabel = 'Áp dụng',
}: {
  open: boolean;
  campaignId: string;
  selectedIds: string[];
  onClose: () => void;
  onApply: (ids: string[]) => void;
  confirmLabel?: string;
}) {
  const fetcher = useCallback(() => shortlistService.all(campaignId), [campaignId]);
  const resource = useAsyncResource(fetcher, open && !!campaignId);
  const [ids, setIds] = useState<string[]>(selectedIds);

  useEffect(() => {
    setIds(selectedIds);
  }, [selectedIds, open]);

  const rows = resource.data?.filter(item => item.status !== 'REMOVED') ?? [];
  const stale = ids.some(id => !rows.some(item => item.creatorId === id));

  return (
    <Modal
      title="Chọn kênh đã lưu"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <p style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>
        Chọn kênh cho lượt gợi ý. Không chọn riêng sẽ dùng <strong>toàn bộ danh sách đã lưu</strong>.
      </p>
      {resource.status === 'loading' ? (
        <Skeleton active />
      ) : resource.status === 'error' ? (
        <Alert
          type="error"
          title="Không thể tải danh sách kênh."
          action={<Button onClick={() => void resource.reload()}>Thử lại</Button>}
        />
      ) : !rows.length ? (
        <Empty description="Chưa có kênh đang lưu trong chiến dịch" />
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <Select
              aria-label="Kênh dùng để gợi ý"
              mode="multiple"
              showSearch
              optionFilterProp="label"
              maxCount={100}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              value={ids}
              onChange={setIds}
              placeholder="Tìm và chọn kênh từ Shortlist"
              options={rows.map(item => ({
                value: item.creatorId,
                label: `${item.creatorName || 'Kênh chưa có tên'}${item.userName ? ' · @' + item.userName.replace(/^@+/, '') : ''} · ${item.platform || 'TIKTOK'}`,
              }))}
            />
          </div>
          {stale && (
            <Alert
              type="warning"
              title="Một số kênh đã chọn không còn trong danh sách. Bỏ chọn hoặc chọn lại trước khi tiếp tục."
              style={{ marginBottom: 12 }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12.5, color: ids.length ? '#1D4ED8' : '#64748B', fontWeight: ids.length ? 600 : 400 }}>
              {ids.length ? `Đã chọn ${ids.length}/${rows.length} kênh (Tối đa 100).` : 'Chưa chọn riêng: Sẽ gợi ý cho toàn bộ danh sách.'}
            </span>
            <Space size="small">
              <Button size="small" onClick={() => setIds(rows.map(r => r.creatorId))}>
                Chọn tất cả ({rows.length})
              </Button>
              <Button size="small" onClick={() => setIds([])}>
                Bỏ chọn hết
              </Button>
            </Space>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              disabled={stale}
              onClick={() => onApply(ids)}
            >
              {confirmLabel} ({ids.length > 0 ? `${ids.length} kênh` : 'Toàn bộ danh sách'})
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
