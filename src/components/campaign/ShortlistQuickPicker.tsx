import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Empty, Input, Modal, Skeleton } from 'antd';
import { shortlistService } from '../../services/api/shortlistService';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import CreatorAvatar from '../../pages/creator/components/discovery/CreatorAvatar';
import '../../pages/creator/CreatorShortlistPage.css';

export default function ShortlistQuickPicker({ open, campaignId, selectedIds, onClose, onApply, confirmLabel = 'Áp dụng', inline = false }: {
  open: boolean; campaignId: string; selectedIds: string[]; onClose: () => void;
  onApply: (ids: string[]) => void; confirmLabel?: string; inline?: boolean;
}) {
  const fetcher = useCallback(() => shortlistService.all(campaignId), [campaignId]);
  const resource = useAsyncResource(fetcher, open && !!campaignId);
  const [ids, setIds] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState('');
  const selectionKey = JSON.stringify(selectedIds);
  useEffect(() => { setIds(JSON.parse(selectionKey)); setSearch(''); }, [selectionKey, open, campaignId]);
  const rows = resource.data?.filter(item => item.status !== 'REMOVED') ?? [];
  const stale = ids.some(id => !rows.some(item => item.creatorId === id));
  const visible = rows.filter(item => `${item.creatorName ?? ''} ${item.userName ?? ''}`.toLocaleLowerCase('vi-VN').includes(search.trim().toLocaleLowerCase('vi-VN')));
  const allSelected = rows.length > 0 && rows.every(item => ids.includes(item.creatorId));
  const content = <div className="sl-quick-picker" role="region" aria-label="Chọn nhanh kênh đã lưu">
    <div className="sl-quick-picker-heading"><strong>Chọn kênh đã lưu</strong><span>Đã chọn {ids.length} / {rows.length}</span></div>
    {resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error'
      ? <Alert type="error" title="Không thể tải danh sách kênh." action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} />
      : !rows.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kênh đang lưu" /> : <>
        <div className="sl-quick-picker-tools"><Input allowClear placeholder="Tìm tên hoặc tài khoản" value={search} onChange={event => setSearch(event.target.value)} />
          <Button size="small" onClick={() => setIds(allSelected ? [] : rows.slice(0, 100).map(item => item.creatorId))}>{allSelected ? 'Bỏ chọn tất cả' : rows.length > 100 ? 'Chọn 100 kênh' : 'Chọn tất cả'}</Button>
        </div>
        {stale && <Alert type="warning" title="Có kênh không còn trong danh sách. Vui lòng chọn lại." />}
        <div className="sl-quick-picker-list">{visible.map(item => <Checkbox className="sl-quick-picker-row" key={item.creatorId}
          checked={ids.includes(item.creatorId)} disabled={!ids.includes(item.creatorId) && ids.length >= 100}
          onChange={event => setIds(previous => event.target.checked ? [...new Set([...previous, item.creatorId])] : previous.filter(id => id !== item.creatorId))}>
          <CreatorAvatar src={item.avatarUrl || undefined} name={item.creatorName || undefined} size={32} />
          <span><strong>{item.creatorName || 'Kênh chưa có tên'}</strong><small>{[item.userName ? '@' + item.userName.replace(/^@+/, '') : null, item.platform].filter(Boolean).join(' · ')}</small></span>
        </Checkbox>)}{!visible.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có kênh khớp từ khóa" />}</div>
      </>}
    <div className="sl-quick-picker-footer"><Button type="text" disabled={!ids.length} onClick={() => setIds([])}>Bỏ chọn</Button>
      <div><Button onClick={onClose}>Đóng</Button><Button type="primary" disabled={resource.status !== 'success' || !rows.length || stale || ids.length > 100} onClick={() => onApply(ids)}>{confirmLabel}{ids.length ? ` (${ids.length})` : ' tất cả'}</Button></div>
    </div>
  </div>;
  if (!open) return null;
  return inline ? content : <Modal title={null} open onCancel={onClose} footer={null} width={640} destroyOnHidden>{content}</Modal>;
}
