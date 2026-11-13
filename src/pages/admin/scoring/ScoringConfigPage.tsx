import { useState } from 'react';
import { authService } from '../../../services/api/authService';
import { useRecommendationConfig } from './hooks/useRecommendationConfig';
import RecommendationConfigState from './components/RecommendationConfigState';
import RecommendationConfigHeader from './components/RecommendationConfigHeader';
import FourMemoryOverview from './components/FourMemoryOverview';
import ConfigurationTabs from './components/ConfigurationTabs';
import PolicyLookup from './components/PolicyLookup';
import './ScoringConfigPage.css';

export default function ScoringConfigPage() {
  const currentUser = authService.getCurrentUser();
  const hasAccess = authService.isManager() && currentUser?.permissions?.includes('MANAGE_RECOMMENDATION_CONFIG') === true;
  const { config, loading, error, fetchConfig } = useRecommendationConfig(hasAccess);
  // Keep selections across API errors and Retry, matching the existing page lifecycle.
  const [activeTab, setActiveTab] = useState('weighting');
  const [selectedObjective, setSelectedObjective] = useState('CONVERSION');
  const [candidatePoolSize, setCandidatePoolSize] = useState(15);
  if (!hasAccess || !config) {
    return <RecommendationConfigState hasAccess={hasAccess} config={config} loading={loading} error={error} fetchConfig={fetchConfig} />;
  }

  return (
    <div className="dm-config" style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      <RecommendationConfigHeader />
      <FourMemoryOverview />
      <ConfigurationTabs config={config} activeTab={activeTab} setActiveTab={setActiveTab}
        lookup={<PolicyLookup config={config}
          selectedObjective={selectedObjective} setSelectedObjective={setSelectedObjective}
          candidatePoolSize={candidatePoolSize} setCandidatePoolSize={setCandidatePoolSize} />} />
      {(config.engineVersion || config.calibrationVersion) && <details className="dm-config-metadata">
        <summary>Thông tin phiên bản</summary>
        <p className="dm-config-muted">Dùng khi cần đối chiếu hoặc báo lỗi cấu hình.</p>
        <dl>
          {config.engineVersion && <><dt>Engine</dt><dd>{config.engineVersion}</dd></>}
          {config.calibrationVersion && <><dt>Hiệu chuẩn</dt><dd>{config.calibrationVersion}</dd></>}
        </dl>
      </details>}
    </div>
  );
}
