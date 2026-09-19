import React from 'react';
import { Button, Avatar, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function SidebarPromo() {
  return (
    <div className="sidebar-promo-card">
      <Avatar
        size={36}
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
        className="sidebar-promo-avatar"
      />
      <div style={{ paddingRight: 36, marginBottom: 6 }}>
        <Title
          level={5}
          style={{
            color: '#0F172A',
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          Tìm đúng Creator cho chiến dịch tiếp theo
        </Title>
      </div>

      <Text
        style={{
          display: 'block',
          color: '#64748B',
          fontSize: 10.5,
          lineHeight: 1.35,
          marginBottom: 10,
        }}
      >
        Ghép nối bằng AI, kết quả vượt trội.
      </Text>

      <Button
        type="primary"
        size="small"
        shape="round"
        block
        style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          fontWeight: 700,
          fontSize: 11.5,
          height: 28,
        }}
        icon={<ArrowRightOutlined style={{ fontSize: 11 }} />}
      >
        Khám phá ngay
      </Button>
    </div>
  );
}
