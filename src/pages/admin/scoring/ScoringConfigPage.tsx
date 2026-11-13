import { useState } from 'react';
import { authService } from '../../../services/api/authService';
import { useRecommendationConfig } from './hooks/useRecommendationConfig';
import RecommendationConfigState from './components/RecommendationConfigState';
import RecommendationConfigHeader from './components/RecommendationConfigHeader';
import FourMemoryOverview from './components/FourMemoryOverview';
import ConfigurationTabs from './components/ConfigurationTabs';
import PolicyLookup from './components/PolicyLookup';

export default function ScoringConfigPage() {
  const { config, loading, error, fetchConfig } = useRecommendationConfig();
  // Keep selections across API errors and Retry, matching the existing page lifecycle.
  const [activeTab, setActiveTab] = useState('weighting');
  const [selectedObjective, setSelectedObjective] = useState('CONVERSION');
  const [candidatePoolSize, setCandidatePoolSize] = useState(15);
  const currentUser = authService.getCurrentUser();
  const hasAccess =
    currentUser?.permissions?.includes('MANAGE_RECOMMENDATION_CONFIG') ||
    ['ADMIN', 'DATA_MANAGER', 'MANAGER', 'admin', 'manager'].includes(currentUser?.role ?? '');

  if (!hasAccess || !config) {
    return <RecommendationConfigState hasAccess={hasAccess} config={config} loading={loading} error={error} fetchConfig={fetchConfig} />;
  }

  return (
    <div className="dm-config" style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      <RecommendationConfigHeader config={config} loading={loading} fetchConfig={fetchConfig} />
      <FourMemoryOverview />
      <ConfigurationTabs config={config} activeTab={activeTab} setActiveTab={setActiveTab} />
      <PolicyLookup config={config}
        selectedObjective={selectedObjective} setSelectedObjective={setSelectedObjective}
        candidatePoolSize={candidatePoolSize} setCandidatePoolSize={setCandidatePoolSize} />
    </div>
  );
}
