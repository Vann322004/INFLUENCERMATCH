import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SyncOutlined,
  CheckCircleOutlined,
  UserOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { DATA_MANAGER_ROUTES } from '../../../../constants/adminRoutes';

export default function DashboardHeader() {
  const navigate = useNavigate();

  return (
    <header className="dm-hero-banner">
      <svg
        className="dm-hero-waves"
        viewBox="0 0 700 260"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M120 260 C 260 150, 360 220, 490 110 C 575 40, 645 65, 700 20 L 700 260 Z"
          fill="url(#dmHeroWave1)"
        />
        <path
          d="M240 260 C 370 180, 470 215, 580 125 C 635 80, 675 95, 700 65 L 700 260 Z"
          fill="url(#dmHeroWave2)"
        />
        <defs>
          <linearGradient id="dmHeroWave1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="dmHeroWave2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.45" />
          </linearGradient>
        </defs>
      </svg>

      <div className="dm-hero-left">
        <div className="dm-hero-status-row">
          <span className="dm-live-pill">
            <span className="dm-live-dot" />
            Pipeline thu thập ổn định
          </span>
          <span className="dm-hero-badge">
            <CheckOutlined style={{ color: '#6D28D9', marginRight: 5, fontSize: 11 }} />
            Trung tâm Vận hành Dữ liệu (Data Manager Console)
          </span>
        </div>

        <h1 className="dm-editorial-title">
          Tổng quan <span className="dm-editorial-italic">dữ liệu</span>
        </h1>

        <p>
          Theo dõi kho định danh Nhà sáng tạo, giám sát tiến trình thu thập tự động, kiểm định chất lượng và xét duyệt quyền sở hữu kênh theo thời gian thực.
        </p>
      </div>

      <div className="dm-hero-actions">
        <Button
          icon={<CheckCircleOutlined />}
          onClick={() => navigate(DATA_MANAGER_ROUTES.DATA_QUALITY)}
          className="dm-btn-secondary"
        >
          Kiểm định chất lượng
        </Button>
        <Button
          icon={<SyncOutlined />}
          onClick={() => navigate(DATA_MANAGER_ROUTES.JOBS)}
          className="dm-btn-secondary"
        >
          Tiến trình thu thập
        </Button>
        <Button
          type="primary"
          icon={<UserOutlined />}
          onClick={() => navigate(DATA_MANAGER_ROUTES.CREATORS)}
          className="dm-btn-primary"
        >
          Định danh Nhà sáng tạo
        </Button>
      </div>
    </header>
  );
}
