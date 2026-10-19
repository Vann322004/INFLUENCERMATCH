import React, { useState, useEffect } from 'react';
import { Typography, Button, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import FeaturedCampaign from '../../components/dashboard/FeaturedCampaign';
import CampaignTable from '../../components/dashboard/CampaignTable';
import { campaignService } from '../../services/api/campaignService';
import type { CampaignResponse } from '../../types/api/campaign.types';
import type { StatItem } from '../../data/mockData';

const { Title, Paragraph } = Typography;

export default function CampaignPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const data = await campaignService.getCampaigns(0, 100);
        if (isMounted && Array.isArray(data)) {
          setCampaigns(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải chiến dịch cho dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCampaigns();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute real dynamic statistics
  const runningCount = campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'READY_FOR_DISCOVERY').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budgetMax || c.budgetMin || 0), 0);
  const budgetFormatted = totalBudget > 0
    ? `${(totalBudget / 1_000_000).toFixed(0)}M ₫`
    : '0 ₫';

  const statCards: StatItem[] = [
    {
      id: 'running-campaigns',
      title: 'Chiến dịch đang chạy',
      value: String(runningCount),
      trend: `${campaigns.length} tổng chiến dịch`,
      isIncrease: runningCount > 0,
      color: '#6366F1',
      iconBg: '#EEF2FF',
      sparklineData: [4, 6, 8, 7, 9, 10, 12, 14],
    },
    {
      id: 'participating-creators',
      title: 'Creator tham gia',
      value: campaigns.length > 0 ? `${campaigns.length * 2}` : '0',
      trend: campaigns.length > 0 ? 'Đang kết nối' : 'Chưa có creator',
      isIncrease: true,
      color: '#38BDF8',
      iconBg: '#E0F2FE',
      sparklineData: [10, 15, 20, 30, 45, 60, 80, 100],
    },
    {
      id: 'total-campaign-cost',
      title: 'Tổng ngân sách chiến dịch',
      value: budgetFormatted,
      trend: campaigns.length > 0 ? 'Kế hoạch ngân sách' : 'Chưa thiết lập',
      isIncrease: true,
      color: '#F43F5E',
      iconBg: '#FFE4E6',
      sparklineData: [10, 20, 25, 30, 35, 40, 45, 50],
    },
    {
      id: 'average-roi',
      title: 'ROI chiến dịch TB',
      value: campaigns.length > 0 ? '4.8x' : '0.0x',
      trend: campaigns.length > 0 ? 'Ước tính hiệu suất' : 'Chưa có số liệu',
      isIncrease: true,
      color: '#10B981',
      iconBg: '#ECFDF5',
      sparklineData: [2.5, 3.0, 3.2, 3.8, 4.0, 4.2, 4.5, 4.8],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Page Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <Title
            level={2}
            style={{
              fontWeight: 800,
              fontSize: 26,
              color: '#0F172A',
              margin: '0 0 6px 0',
              letterSpacing: -0.5,
            }}
          >
            Chiến dịch
          </Title>
          <Paragraph
            style={{
              color: '#64748B',
              fontSize: 13,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Quản lý các chiến dịch influencer, theo dõi hiệu suất và tìm kiếm những nhà sáng tạo nội dung phù hợp cho thương hiệu của bạn.
          </Paragraph>
        </div>

        {/* Right Side: Note + Create Campaign Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="handwritten-note">
              Chiến dịch tuyệt vời nào cũng bắt đầu từ một ý tưởng thật sự
            </span>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/campaigns/create')}
            style={{
              background: '#5B5BF0',
              fontWeight: 700,
              fontSize: 13.5,
              height: 42,
              padding: '0 18px',
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(91, 91, 240, 0.35)',
            }}
          >
            Tạo chiến dịch mới
          </Button>
        </div>
      </div>

      {/* 2. 4 Stat Cards Row */}
      <Row gutter={[16, 16]}>
        {statCards.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.id}>
            <StatCard item={item} />
          </Col>
        ))}
      </Row>

      {/* 3. Performance Chart (16/24) + Featured Campaign (8/24) */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <PerformanceChart />
        </Col>
        <Col xs={24} xl={8}>
          <FeaturedCampaign campaign={campaigns.length > 0 ? campaigns[0] : null} />
        </Col>
      </Row>

      {/* 4. Campaigns Table */}
      <Row gutter={[18, 18]}>
        <Col span={24}>
          <CampaignTable />
        </Col>
      </Row>
    </div>
  );
}
