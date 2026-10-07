import React, { useState } from 'react';
import {
  Drawer,
  Tabs,
  Badge,
  Button,
  Avatar,
  Tag,
  Switch,
  message,
  Typography,
  Radio,
  Divider,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  MailOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CreditCardOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  INITIAL_NOTIFICATIONS,
  INITIAL_EMAIL_ALERTS,
} from '../../data/mockData';
import type { InAppNotification, EmailAlertSettings } from '../../data/mockData';

const { Text, Title, Paragraph } = Typography;

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<InAppNotification[]>(INITIAL_NOTIFICATIONS);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [emailAlerts, setEmailAlerts] = useState<EmailAlertSettings>(INITIAL_EMAIL_ALERTS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    message.success('Đã đánh dấu tất cả thông báo là đã đọc!');
  };

  const handleNotificationClick = (item: InAppNotification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.linkUrl) {
      onClose();
      navigate(item.linkUrl);
    }
  };

  const handleSaveEmailAlerts = () => {
    message.success('Cập nhật cài đặt nhận thông báo qua email thành công!');
  };

  const filteredList = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    return true;
  });

  const getNotifIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'deliverable':
        return <VideoCameraOutlined style={{ color: '#8B5CF6' }} />;
      case 'invitation':
        return <CheckCircleOutlined style={{ color: '#10B981' }} />;
      case 'quota':
        return <WarningOutlined style={{ color: '#F59E0B' }} />;
      case 'payment':
        return <CreditCardOutlined style={{ color: '#3B82F6' }} />;
      case 'system':
      default:
        return <ThunderboltOutlined style={{ color: '#6366F1' }} />;
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellOutlined style={{ color: '#5B5BF0', fontSize: 18 }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>Trung tâm thông báo</span>
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ backgroundColor: '#EF4444' }} />
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              onClick={handleMarkAllAsRead}
              style={{ fontSize: 12, padding: 0, color: '#5B5BF0', fontWeight: 600 }}
            >
              Đọc tất cả
            </Button>
          )}
        </div>
      }
      placement="right"
      width={440}
      onClose={onClose}
      open={open}
      bodyStyle={{ padding: '0 20px 20px 20px' }}
    >
      <Tabs
        defaultActiveKey="inapp"
        items={[
          {
            key: 'inapp',
            label: (
              <span style={{ fontWeight: 600 }}>
                Thông báo ({unreadCount} mới)
              </span>
            ),
            children: (
              <div>
                {/* Filter toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 14px 0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Cập nhật tiến độ chiến dịch & giao dịch
                  </Text>
                  <Radio.Group
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    size="small"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="all">Tất cả</Radio.Button>
                    <Radio.Button value="unread">Chưa đọc</Radio.Button>
                  </Radio.Group>
                </div>

                {/* Notifications list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                      <CheckOutlined style={{ fontSize: 32, marginBottom: 8, color: '#10B981' }} />
                      <div style={{ fontWeight: 600 }}>Không có thông báo mới</div>
                      <div style={{ fontSize: 12 }}>Bạn đã xem hết các thông báo gần đây!</div>
                    </div>
                  ) : (
                    filteredList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        style={{
                          background: item.read ? '#FFFFFF' : '#F5F3FF',
                          border: item.read ? '1px solid #EEF0F6' : '1px solid #DDD6FE',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s',
                        }}
                      >
                        {!item.read && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: '#8B5CF6',
                            }}
                          />
                        )}

                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          {item.avatar ? (
                            <Avatar src={item.avatar} size={36} style={{ flexShrink: 0 }} />
                          ) : (
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: '#EEF2FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                flexShrink: 0,
                              }}
                            >
                              {getNotifIcon(item.type)}
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: 0, paddingRight: item.read ? 0 : 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', lineHeight: 1.3 }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: 12, color: '#475569', marginTop: 3, lineHeight: 1.4 }}>
                              {item.message}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                              <span style={{ fontSize: 11, color: '#94A3B8' }}>{item.timeAgo}</span>
                              {item.linkText && (
                                <span
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: '#5B5BF0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  {item.linkText} <ArrowRightOutlined style={{ fontSize: 10 }} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'settings',
            label: (
              <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MailOutlined /> Cài đặt Email Alerts
              </span>
            ),
            children: (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18 }}>
                  Lựa chọn các loại thông báo bạn muốn nhận tự động qua email <strong>contact@glowbeauty.vn</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>Creator nộp bài duyệt</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>Nhận link xem video draft và kịch bản mới</div>
                    </div>
                    <Switch
                      checked={emailAlerts.deliverableReview}
                      onChange={(checked) => setEmailAlerts((p) => ({ ...p, deliverableReview: checked }))}
                    />
                  </div>

                  <Divider style={{ margin: 0 }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>Creator chấp thuận lời mời</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>Thông báo khi Creator đồng ý ký thỏa thuận</div>
                    </div>
                    <Switch
                      checked={emailAlerts.creatorAccepted}
                      onChange={(checked) => setEmailAlerts((p) => ({ ...p, creatorAccepted: checked }))}
                    />
                  </div>

                  <Divider style={{ margin: 0 }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>Cảnh báo hạn mức Quota</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>Khi tài khoản chỉ còn dưới 20% dung lượng</div>
                    </div>
                    <Switch
                      checked={emailAlerts.quotaWarning}
                      onChange={(checked) => setEmailAlerts((p) => ({ ...p, quotaWarning: checked }))}
                    />
                  </div>

                  <Divider style={{ margin: 0 }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>Báo cáo hiệu suất định kỳ</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>Tổng kết lượt view, tương tác và ROI vào sáng Thứ 2</div>
                    </div>
                    <Switch
                      checked={emailAlerts.weeklyPerformanceReport}
                      onChange={(checked) => setEmailAlerts((p) => ({ ...p, weeklyPerformanceReport: checked }))}
                    />
                  </div>

                  <Divider style={{ margin: 0 }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>Hóa đơn & Gia hạn gói</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>Hóa đơn điện tử VAT khi gia hạn thành công</div>
                    </div>
                    <Switch
                      checked={emailAlerts.invoiceBilling}
                      onChange={(checked) => setEmailAlerts((p) => ({ ...p, invoiceBilling: checked }))}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 28 }}>
                  <Button
                    type="primary"
                    block
                    style={{ background: '#5B5BF0', borderRadius: 10, fontWeight: 700, height: 40 }}
                    onClick={handleSaveEmailAlerts}
                  >
                    Lưu cài đặt thông báo Email
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
}
