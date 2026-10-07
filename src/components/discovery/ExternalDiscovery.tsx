import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Row,
  Col,
  Tag,
  Avatar,
  Space,
  Progress,
  Typography,
  message,
  Divider,
} from 'antd';
import {
  GlobalOutlined,
  SearchOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  PlusOutlined,
  HeartOutlined,
  HeartFilled,
  InstagramOutlined,
  LinkOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface ScannedCreatorResult {
  url: string;
  name: string;
  username: string;
  avatar: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  followers: string;
  engagement: string;
  avgViews: string;
  matchScore: number;
  niche: string[];
  location: string;
  aiExplanation: string;
  isSaved?: boolean;
}

export default function ExternalDiscovery() {
  const navigate = useNavigate();
  const [inputUrl, setInputUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [scannedResult, setScannedResult] = useState<ScannedCreatorResult | null>(null);

  const handleStartScan = (targetUrl?: string) => {
    const url = targetUrl || inputUrl;
    if (!url.trim()) {
      message.warning('Vui lòng nhập đường link kênh TikTok, Instagram hoặc YouTube!');
      return;
    }

    setIsScanning(true);
    setScanStep('Đang kết nối API mạng xã hội...');

    setTimeout(() => {
      setScanStep('Cào dữ liệu 25 video gần nhất & phân tích lượng tương tác...');
    }, 600);

    setTimeout(() => {
      setScanStep('Mô hình AI đang tính điểm Match Score với hồ sơ thương hiệu của bạn...');
    }, 1200);

    setTimeout(() => {
      setIsScanning(false);
      setScanStep('');

      const isTikTok = url.includes('tiktok');
      const isIG = url.includes('instagram');

      setScannedResult({
        url,
        name: isIG ? 'Mai Trần (Ext)' : 'Linh Nguyễn Beauty',
        username: isIG ? 'maitran.glow' : 'linhnguyen.official',
        avatar: isIG
          ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        platform: isIG ? 'instagram' : 'tiktok',
        followers: isIG ? '680K' : '1.35M',
        engagement: isIG ? '4.8%' : '8.9%',
        avgViews: isIG ? '54.2K' : '142.8K',
        matchScore: isIG ? 91 : 96,
        niche: ['Làm đẹp & Chăm sóc da', 'Clean Beauty', 'Phong cách sống'],
        location: 'TP. Hồ Chí Minh',
        aiExplanation:
          'Kênh có tỷ lệ tương tác vượt 2.8x so với trung bình ngành. Khán giả 82% Nữ độ tuổi 18-24 tại TP.HCM, tần suất nhắc đến từ khóa "skincare lành tính" rất cao.',
        isSaved: false,
      });

      message.success('Quét và phân tích kênh ngoài thành công!');
    }, 1800);
  };

  const handleQuickPaste = (url: string) => {
    setInputUrl(url);
    handleStartScan(url);
  };

  const handleToggleSave = () => {
    if (!scannedResult) return;
    const newStatus = !scannedResult.isSaved;
    setScannedResult({ ...scannedResult, isSaved: newStatus });
    message.success(
      newStatus
        ? `Đã lưu ${scannedResult.name} vào Shortlist!`
        : `Đã bỏ lưu ${scannedResult.name}`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Intro Box */}
      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          color: '#FFFFFF',
          border: 'none',
        }}
        bodyStyle={{ padding: '24px 28px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <GlobalOutlined style={{ color: '#FDE047', fontSize: 18 }} />
          <span style={{ fontWeight: 800, fontSize: 18 }}>Khám phá kênh ngoài (External Discovery)</span>
          <Tag color="gold" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
            TÍNH NĂNG MỞ RỘNG
          </Tag>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, maxWidth: 680, margin: '0 0 16px 0' }}>
          Bạn tìm thấy một Creator tiềm năng trên TikTok hoặc Instagram chưa có trong hệ thống? Dán đường link kênh để AI tự động cào số liệu, phân tích chỉ số và tính toán mức độ phù hợp với thương hiệu của bạn!
        </p>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: 10, maxWidth: 720 }}>
          <Input
            size="large"
            prefix={<LinkOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Dán link kênh (ví dụ: https://www.tiktok.com/@linhnguyen.official)"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            style={{ borderRadius: 10, fontSize: 13.5 }}
            onPressEnter={() => handleStartScan()}
          />
          <Button
            type="primary"
            size="large"
            loading={isScanning}
            icon={<SearchOutlined />}
            onClick={() => handleStartScan()}
            style={{
              background: '#FDE047',
              color: '#1E1B4B',
              borderColor: '#FDE047',
              fontWeight: 800,
              borderRadius: 10,
              height: 40,
              padding: '0 24px',
            }}
          >
            Quét & Phân tích AI
          </Button>
        </div>

        {/* Quick Example Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Thử nhanh đường link mẫu:</span>
          <Button
            size="small"
            ghost
            style={{ borderRadius: 6, borderColor: 'rgba(255,255,255,0.4)', color: '#FFFFFF', fontSize: 11 }}
            onClick={() => handleQuickPaste('https://www.tiktok.com/@linhnguyen.official')}
          >
            tiktok.com/@linhnguyen.official
          </Button>
          <Button
            size="small"
            ghost
            style={{ borderRadius: 6, borderColor: 'rgba(255,255,255,0.4)', color: '#FFFFFF', fontSize: 11 }}
            onClick={() => handleQuickPaste('https://instagram.com/maitran.glow')}
          >
            instagram.com/maitran.glow
          </Button>
        </div>
      </Card>

      {/* Loading Scanning State */}
      {isScanning && (
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Progress type="circle" percent={70} strokeColor="#6366F1" size={70} status="active" />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
              {scanStep || 'AI đang phân tích kênh ngoài...'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              Quá trình này chỉ mất khoảng 2 - 3 giây.
            </div>
          </div>
        </Card>
      )}

      {/* Scanned Result Card */}
      {scannedResult && !isScanning && (
        <Card
          style={{
            borderRadius: 16,
            border: '1.5px solid #C7D2FE',
            background: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Avatar src={scannedResult.avatar} size={64} style={{ border: '2px solid #E2E8F0' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18, color: '#0F172A' }}>
                    {scannedResult.name}
                  </h3>
                  <CheckCircleFilled style={{ color: '#2563EB', fontSize: 14 }} />
                  <Tag color="geekblue" style={{ borderRadius: 6, textTransform: 'uppercase', fontWeight: 700, fontSize: 10.5 }}>
                    {scannedResult.platform}
                  </Tag>
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  @{scannedResult.username} • 📍 {scannedResult.location}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {scannedResult.niche.map((tag) => (
                    <Tag key={tag} style={{ borderRadius: 6, fontSize: 11, background: '#F1F5F9', border: 'none' }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Match Score Badge */}
            <div
              style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1px solid #A7F3D0',
                borderRadius: 12,
                padding: '12px 18px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                ✦ AI Match Score
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>
                {scannedResult.matchScore}%
              </div>
              <div style={{ fontSize: 11, color: '#065F46', fontWeight: 600 }}>Rất phù hợp nhãn hàng</div>
            </div>
          </div>

          {/* AI Explanation Box */}
          <div
            style={{
              background: '#FAF5FF',
              border: '1px solid #DDD6FE',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 12.5, color: '#6B21A8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ThunderboltFilled /> Lý giải đề xuất AI (AI Explanation):
            </div>
            <div style={{ fontSize: 12.5, color: '#4C1D95', lineHeight: 1.5 }}>
              {scannedResult.aiExplanation}
            </div>
          </div>

          {/* Stats Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8}>
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{scannedResult.followers}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Người theo dõi thực tế</div>
              </div>
            </Col>
            <Col xs={12} sm={8}>
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>{scannedResult.engagement}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Tỷ lệ tương tác TB</div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#6366F1' }}>{scannedResult.avgViews}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Lượt xem trung vị / Video</div>
              </div>
            </Col>
          </Row>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button
              icon={scannedResult.isSaved ? <HeartFilled style={{ color: '#EF4444' }} /> : <HeartOutlined />}
              onClick={handleToggleSave}
              style={{
                borderRadius: 8,
                height: 40,
                color: scannedResult.isSaved ? '#EF4444' : '#334155',
                borderColor: scannedResult.isSaved ? '#FECDD3' : '#E2E8F0',
                fontWeight: 600,
              }}
            >
              {scannedResult.isSaved ? 'Đã lưu vào Shortlist' : 'Lưu vào Shortlist'}
            </Button>

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                message.success(`Đang mở giao diện gửi lời mời hợp tác tới ${scannedResult.name}...`);
                navigate('/campaigns/create');
              }}
              style={{
                background: '#5B5BF0',
                borderRadius: 8,
                fontWeight: 700,
                height: 40,
                padding: '0 20px',
              }}
            >
              Mời vào chiến dịch
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
