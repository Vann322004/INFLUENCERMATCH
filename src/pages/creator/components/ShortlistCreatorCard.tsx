import { App, Button, Checkbox, Dropdown } from 'antd';
import CreatorAvatar from './discovery/CreatorAvatar';
import { CheckCircleFilled, MoreOutlined } from '@ant-design/icons';
import type { ShortlistRecord } from '../../../types/api/shortlist.types';
import { shortlistLabel, shortlistNumber } from './shortlistDisplay';
import '../CreatorShortlistPage.css';

export const formatFollowers = (followers?: number | null) => {
  if (followers == null || !Number.isFinite(followers)) return 'Chưa có dữ liệu';
  if (followers >= 1_000_000) return `${(followers / 1_000_000).toFixed(1)}M`;
  if (followers >= 1_000) return `${Math.round(followers / 1_000)}K`;
  return followers.toLocaleString('vi-VN');
};

export const formatEngagement = (er?: number | null) => {
  if (er == null || !Number.isFinite(er)) return 'Chưa có dữ liệu';
  return (er * 100).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};

export const formatFee = (item: { actualFee?: number | null; estimatedFeeMin?: number | null; estimatedFeeMax?: number | null }) => {
  if (item.actualFee != null) return `${shortlistNumber(item.actualFee)} ₫`;
  if (item.estimatedFeeMin != null && item.estimatedFeeMax != null) {
    return item.estimatedFeeMin === item.estimatedFeeMax
      ? `${shortlistNumber(item.estimatedFeeMin)} ₫`
      : `${shortlistNumber(item.estimatedFeeMin)} – ${shortlistNumber(item.estimatedFeeMax)} ₫`;
  }
  if (item.estimatedFeeMin != null) return `Từ ${shortlistNumber(item.estimatedFeeMin)} ₫`;
  if (item.estimatedFeeMax != null) return `Đến ${shortlistNumber(item.estimatedFeeMax)} ₫`;
  return 'Chưa có báo giá';
};

export default function ShortlistCreatorCard({
  item,
  checked,
  busy,
  onToggle,
  onEdit,
  onRemove,
  onRestore,
  onView,
}: {
  item: ShortlistRecord;
  checked: boolean;
  busy: boolean;
  onToggle: (checked: boolean) => void;
  onEdit: () => void;
  onRemove: () => Promise<unknown>;
  onRestore: () => void;
  onView: () => void;
}) {
  const { modal } = App.useApp();
  const categories = [...new Set([item.niche, item.category].flatMap(value => value?.split(/[,;]/).map(text => text.trim()).filter(Boolean) ?? []))].slice(0, 3);
  const bio = item.contentSummary?.trim();
  const hasBio = !!bio && !/^(creator|koc|kol)$/i.test(bio);
  const removed = item.status === 'REMOVED';
  const date = item.addedAt ? new Date(item.addedAt) : null;
  const addedDate = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('vi-VN') : null;
  const sourceLabel = item.source === 'MANUAL_DISCOVERY' ? 'Từ Khám phá' : ['AI_RECOMMENDATION', 'AI_RECOMMENDED'].includes(item.source ?? '') ? 'Từ Gợi ý AI' : null;

  return (
    <article className={'sl-channel-card' + (checked ? ' is-selected' : '')}>
      <div className="sl-channel-topline">
        <div className="sl-channel-labels">{item.platform && <span className="sl-channel-platform">{item.platform}</span>}<span>{shortlistLabel(item.status)}</span>{sourceLabel && <span className="sl-channel-source">{sourceLabel}</span>}</div>
        <Checkbox checked={checked} disabled={removed || busy} aria-label={'Chọn ' + (item.creatorName || 'kênh chưa có tên')} onChange={event => onToggle(event.target.checked)} />
      </div>
      <header className="sl-channel-identity">
        <CreatorAvatar size={44} src={item.avatarUrl || undefined} name={item.creatorName || undefined} />
        <div className="sl-channel-author">
          <h3><button type="button" onClick={onView}>{item.creatorName || 'Kênh chưa có tên'}</button>{item.verifiedByInfluencerMatch && <CheckCircleFilled title="Đã xác minh" />}</h3>
          <p>{item.userName ? '@' + item.userName.replace(/^@+/, '') : 'Chưa có tên tài khoản'}</p>
        </div>
        <Dropdown trigger={['click']} menu={{
          items: [
            { key: 'view', label: 'Xem hồ sơ' },
            { key: 'edit', label: 'Ghi chú và mức ưu tiên', disabled: busy || removed },
            { key: 'remove', label: 'Bỏ khỏi danh sách', disabled: busy || removed, danger: true },
          ],
          onClick: ({ key }) => {
            if (key === 'view') onView();
            else if (key === 'edit') onEdit();
            else modal.confirm({ title: 'Bỏ kênh khỏi danh sách đã chọn?', content: 'Bạn có thể khôi phục kênh sau từ danh sách.', okText: 'Bỏ khỏi danh sách', cancelText: 'Hủy', onOk: onRemove });
          },
        }}><Button type="text" icon={<MoreOutlined />} aria-label={'Thao tác với ' + (item.creatorName || 'kênh')} /></Dropdown>
      </header>
      <div className="sl-channel-categories">{categories.length ? categories.map(category => <span key={category}>{category}</span>) : <span className="sl-channel-missing">Chưa có ngành hàng</span>}</div>
      <dl className="sl-channel-metrics">
        <div><dt>Người theo dõi</dt><dd title={shortlistNumber(item.followers)}>{formatFollowers(item.followers)}</dd></div>
        <div><dt>Tỷ lệ tương tác</dt><dd>{formatEngagement(item.engagementRate)}</dd></div>
      </dl>
      <div className="sl-channel-fee"><span>{item.actualFee != null ? 'Phí đã ghi nhận' : 'Phí ước tính'}</span><strong>{formatFee(item)}</strong></div>
      <div className="sl-channel-context">
        <button type="button" className={`sl-channel-priority sl-channel-priority-${item.priority.toLowerCase()}`} disabled={busy || removed} onClick={onEdit}>Ưu tiên: <strong>{shortlistLabel(item.priority)}</strong></button>
        {!removed && !item.note?.trim() && (
          <button type="button" className="sl-channel-inline-note-btn" disabled={busy} onClick={onEdit}>+ Thêm ghi chú</button>
        )}
        {addedDate && <span>Lưu {addedDate}</span>}
      </div>
      {hasBio && <details className="sl-channel-description"><summary>Giới thiệu kênh</summary><p>{bio}</p></details>}
      {item.note?.trim() && (
        <div className="sl-channel-note">
          <div className="sl-channel-note-heading"><span>Ghi chú lựa chọn</span>{!removed && <button type="button" disabled={busy} onClick={onEdit}>Chỉnh sửa</button>}</div>
          <details><summary>{item.note}</summary><p>{item.note}</p></details>
        </div>
      )}
      <footer className="sl-channel-actions"><Button onClick={onView}>Xem hồ sơ</Button>{removed ? <Button disabled={busy} onClick={onRestore}>Khôi phục</Button> : <Button className="sl-channel-select" disabled={busy} onClick={() => onToggle(!checked)}>{checked ? 'Bỏ chọn kênh' : 'Chọn để gợi ý'}</Button>}</footer>
    </article>
  );
}
