import { Avatar, Button, Checkbox, Dropdown, Modal, Tag } from 'antd';
import { CheckCircleFilled, MoreOutlined } from '@ant-design/icons';
import type { ShortlistRecord } from '../../../types/api/shortlist.types';
import { shortlistNumber } from './shortlistDisplay';

export const formatFollowers = (followers?: number | null) => {
  if (followers == null || isNaN(followers)) return '0';
  if (followers >= 1_000_000) return `${(followers / 1_000_000).toFixed(1)}M`;
  if (followers >= 1_000) return `${Math.round(followers / 1_000)}K`;
  return followers.toLocaleString('vi-VN');
};

export const formatEngagement = (er?: number | null) => {
  if (er == null || isNaN(er)) return 'Chưa có';
  if (er > 0 && er <= 1) return `${(er * 100).toFixed(2)}%`;
  return `${Number(er).toFixed(2)}%`;
};

export const formatFee = (item: { actualFee?: number | null; estimatedFeeMin?: number | null; estimatedFeeMax?: number | null }) => {
  if (item.actualFee != null) return shortlistNumber(item.actualFee);
  if (item.estimatedFeeMin != null && item.estimatedFeeMax != null) {
    return item.estimatedFeeMin === item.estimatedFeeMax
      ? shortlistNumber(item.estimatedFeeMin)
      : `${shortlistNumber(item.estimatedFeeMin)}–${shortlistNumber(item.estimatedFeeMax)}`;
  }
  if (item.estimatedFeeMin != null) return `Từ ${shortlistNumber(item.estimatedFeeMin)}`;
  if (item.estimatedFeeMax != null) return `Đến ${shortlistNumber(item.estimatedFeeMax)}`;
  return 'Chưa có';
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
  const categories = [
    ...new Set(
      [item.niche, item.category].flatMap(
        (value) => value?.split(/[,;]/).map((text) => text.trim()).filter(Boolean) ?? []
      )
    ),
  ].slice(0, 3);
  const fee = formatFee(item);

  return (
    <div className={`cdiscovery-card${checked ? ' is-selected' : ''}`}>
      {/* Hàng 1: Checkbox + Avatar + Tên + Tick + Username + Platform Badge + Dropdown More */}
      <div className="cdiscovery-card-top-row">
        <div className="cdiscovery-card-left-group">
          <Checkbox
            className="cdiscovery-card-checkbox"
            aria-label={`Chọn ${item.creatorName || 'kênh chưa có tên'}`}
            disabled={item.status === 'REMOVED' || busy}
            checked={checked}
            onChange={(event) => onToggle(event.target.checked)}
          />
          <div
            className="cdiscovery-card-avatar-wrap"
            onClick={onView}
          >
            <Avatar
              size={44}
              src={item.avatarUrl || undefined}
              style={{ border: '1px solid #E2E8F0', cursor: 'pointer' }}
            >
              {item.creatorName?.charAt(0)}
            </Avatar>
          </div>
          <div
            className="cdiscovery-card-author-meta"
            onClick={onView}
          >
            <div className="cdiscovery-card-name-title" title={item.creatorName || undefined}>
              <span>{item.creatorName || 'Kênh chưa có tên'}</span>
              {item.verifiedByInfluencerMatch && (
                <CheckCircleFilled style={{ color: '#3B82F6', fontSize: 13 }} />
              )}
            </div>
            <div className="cdiscovery-card-username-text">
              {item.userName ? '@' + item.userName.replace(/^@+/, '') : 'Chưa có tên tài khoản'}
            </div>
          </div>
        </div>

        <div className="cdiscovery-card-right-group">
          {item.priority === 'HIGH' && (
            <span
              style={{
                background: '#FEF2F2',
                color: '#DC2626',
                fontWeight: 500,
                fontSize: 10.5,
                padding: '2px 7px',
                borderRadius: 999,
                border: '1px solid #FECACA',
              }}
            >
              Ưu tiên cao
            </span>
          )}
          <Tag
            color="default"
            style={{
              borderRadius: 12,
              margin: 0,
              fontWeight: 500,
              fontSize: 11,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              textTransform: 'uppercase',
            }}
          >
            {item.platform || 'TIKTOK'}
          </Tag>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'view', label: 'Xem chi tiết hồ sơ' },
                { key: 'edit', label: 'Ghi chú và mức ưu tiên', disabled: busy || item.status === 'REMOVED' },
                { key: 'remove', label: 'Bỏ khỏi danh sách', disabled: busy || item.status === 'REMOVED' },
              ],
              onClick: ({ key }) => {
                if (key === 'view') onView();
                else if (key === 'edit') onEdit();
                else {
                  Modal.confirm({
                    title: 'Bỏ kênh khỏi danh sách đã chọn?',
                    content: 'Bạn có thể khôi phục kênh sau từ danh sách.',
                    okText: 'Bỏ khỏi danh sách',
                    cancelText: 'Hủy',
                    onOk: onRemove,
                  });
                }
              },
            }}
          >
            <button
              type="button"
              className="cdiscovery-card-dots-btn"
              aria-label={`Thao tác với ${item.creatorName || 'kênh'}`}
            >
              <MoreOutlined />
            </button>
          </Dropdown>
        </div>
      </div>

      {/* Hàng 2: Tags Niche / Category pastel */}
      <div className="cdiscovery-card-tags-row">
        {categories.length ? (
          categories.map((category) => (
            <span key={category} className="cdiscovery-niche-pill">
              {category}
            </span>
          ))
        ) : (
          <span className="cdiscovery-niche-pill">Chưa có ngành hàng</span>
        )}
      </div>

      {/* Hàng 3: Box 3 Metrics chia cột */}
      <div className="cdiscovery-card-metrics-box">
        <div className="cdiscovery-metric-col">
          <span className="cdiscovery-metric-number">{formatFollowers(item.followers)}</span>
          <span className="cdiscovery-metric-caption">Người theo dõi</span>
        </div>
        <div className="cdiscovery-metric-col">
          <span className="cdiscovery-metric-number">{formatEngagement(item.engagementRate)}</span>
          <span className="cdiscovery-metric-caption">Tương tác</span>
        </div>
        <div className="cdiscovery-metric-col">
          <span className="cdiscovery-metric-number">{fee}</span>
          <span className="cdiscovery-metric-caption">Báo giá tham khảo</span>
        </div>
      </div>

      {/* Hàng 4: Bio ngắn */}
      <div className="cdiscovery-card-bio-text" title={item.contentSummary || undefined}>
        {item.contentSummary || 'Chưa có mô tả nội dung kênh.'}
      </div>

      {/* Hàng 5: Nút hành động */}
      <div className="cdiscovery-card-actions-row">
        <Button className="cdiscovery-btn-profile-card" onClick={onView}>
          Xem hồ sơ
        </Button>
        {item.status === 'REMOVED' ? (
          <Button disabled={busy} onClick={onRestore}>
            Khôi phục
          </Button>
        ) : (
          <Button
            type="primary"
            className={`cdiscovery-btn-shortlist-card ${checked ? 'saved' : ''}`}
            disabled={busy}
            onClick={() => onToggle(!checked)}
          >
            {checked ? '✓ Đã chọn gợi ý' : '+ Chọn để gợi ý'}
          </Button>
        )}
      </div>
    </div>
  );
}
