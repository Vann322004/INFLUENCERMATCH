import React from 'react';
import { Modal, Radio, Avatar, Tag, Button } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import type { IdentityConflictItem } from '../../types';
import { PLATFORM_COLOR_MAP } from '../../types';

interface MergeConflictModalProps {
  open: boolean;
  selectedConflict: IdentityConflictItem | null;
  masterProfileId: string;
  onMasterProfileChange: (id: string) => void;
  merging: boolean;
  onCancel: () => void;
  onConfirmMerge: () => Promise<void>;
}

export const MergeConflictModal: React.FC<MergeConflictModalProps> = ({
  open,
  selectedConflict,
  masterProfileId,
  onMasterProfileChange,
  merging,
  onCancel,
  onConfirmMerge,
}) => {
  if (!selectedConflict) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
          <SwapOutlined style={{ color: '#2563EB' }} />
          <span>Hợp nhất Hồ sơ Creator Đa nền tảng (Merge Entity)</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={580}
    >
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
          Hệ thống sẽ liên kết hai hồ sơ mạng xã hội này thành <strong>một thực thể Creator duy nhất</strong> trong Creator Catalog. Số liệu người theo dõi và bài đăng sẽ được hiển thị tổng hợp.
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Chọn hồ sơ chính đại diện (Primary Master Profile):
          </div>
          <Radio.Group
            value={masterProfileId}
            onChange={(e) => onMasterProfileChange(e.target.value)}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <Radio
              value={selectedConflict.profileA.id}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: masterProfileId === selectedConflict.profileA.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: masterProfileId === selectedConflict.profileA.id ? '#EFF6FF' : '#FFFFFF',
                width: '100%',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, verticalAlign: 'middle' }}>
                <Avatar size={30} src={selectedConflict.profileA.avatarUrl} />
                <span style={{ fontWeight: 700 }}>{selectedConflict.profileA.displayName}</span>
                <Tag color={PLATFORM_COLOR_MAP[selectedConflict.profileA.platform.toLowerCase()] || 'default'}>
                  {selectedConflict.profileA.platform.toUpperCase()}
                </Tag>
                <span style={{ fontSize: 11.5, color: '#64748B' }}>
                  ({(selectedConflict.profileA.followers / 1000).toLocaleString()}K flw)
                </span>
              </div>
            </Radio>

            <Radio
              value={selectedConflict.profileB.id}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: masterProfileId === selectedConflict.profileB.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: masterProfileId === selectedConflict.profileB.id ? '#EFF6FF' : '#FFFFFF',
                width: '100%',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, verticalAlign: 'middle' }}>
                <Avatar size={30} src={selectedConflict.profileB.avatarUrl} />
                <span style={{ fontWeight: 700 }}>{selectedConflict.profileB.displayName}</span>
                <Tag color={PLATFORM_COLOR_MAP[selectedConflict.profileB.platform.toLowerCase()] || 'default'}>
                  {selectedConflict.profileB.platform.toUpperCase()}
                </Tag>
                <span style={{ fontSize: 11.5, color: '#64748B' }}>
                  ({(selectedConflict.profileB.followers / 1000).toLocaleString()}K flw)
                </span>
              </div>
            </Radio>
          </Radio.Group>
        </div>

        {/* Merge Result Preview */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
            Kết quả hiển thị sau khi hợp nhất:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={46}
              src={
                masterProfileId === selectedConflict.profileA.id
                  ? selectedConflict.profileA.avatarUrl
                  : selectedConflict.profileB.avatarUrl
              }
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                {masterProfileId === selectedConflict.profileA.id
                  ? selectedConflict.profileA.displayName
                  : selectedConflict.profileB.displayName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
                  Liên kết: {selectedConflict.profileA.platform.toUpperCase()} + {selectedConflict.profileB.platform.toUpperCase()}
                </Tag>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                  Tổng: {((selectedConflict.profileA.followers + selectedConflict.profileB.followers) / 1000000).toFixed(2)}M Followers
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            loading={merging}
            onClick={onConfirmMerge}
            style={{ background: '#2563EB', fontWeight: 700, borderRadius: 6 }}
          >
            Xác nhận Hợp nhất Hồ sơ
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MergeConflictModal;

