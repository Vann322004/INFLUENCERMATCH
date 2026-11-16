import React from 'react';
import { Alert } from 'antd';
import HunterSetupCard from './HunterSetupCard';
import HunterRadarScanner from './HunterRadarScanner';
import DiscoveredFeedCard from './DiscoveredFeedCard';
import DirectCrawlModal from '../DirectCrawlModal';
import { useAutoHunter } from '../../hooks/useAutoHunter';

export default function AutoHunterTab() {
  const {
    mode, setMode,
    platform, setPlatform,
    topics, topicsLoading, topicsError, reloadTopics,
    selectedTopic, handleSelectTopic,
    activeKeywords, setActiveKeywords,
    customUsernames, setCustomUsernames,
    maxKocs, setMaxKocs,
    loading,
    currentKeyword, progressPercent, scannedCount, filteredOutCount, pendingReviewCount, matchedCount, logLines,
    discoveredList, setDiscoveredList,
    inspectModalOpen, setInspectModalOpen,
    inspectUsername,
    feedRef,
    handleStartHunting,
    handleImportSingle,
    handleInspectDetail,
    handleNavigateQuality,
    location,
  } = useAutoHunter();

  return (
    <div>
      {topicsError && <Alert type="error" showIcon title={topicsError} style={{ marginBottom: 16 }} />}
      <HunterSetupCard
        topics={topics}
        topicsLoading={topicsLoading}
        topicsError={topicsError}
        topicsManagementPath={`${location.pathname.startsWith('/data-manager') ? '/data-manager' : '/admin'}/data-sources`}
        onReloadTopics={reloadTopics}
        mode={mode}
        onModeChange={setMode}
        platform={platform}
        selectedTopic={selectedTopic}
        activeKeywords={activeKeywords}
        customUsernames={customUsernames}
        onCustomUsernamesChange={setCustomUsernames}
        maxKocs={maxKocs}
        loading={loading}
        onPlatformChange={setPlatform}
        onSelectTopic={handleSelectTopic}
        onKeywordsChange={setActiveKeywords}
        onMaxKocsChange={setMaxKocs}
        onStartHunting={handleStartHunting}
      />

      {(loading || logLines.length > 0) && (
        <HunterRadarScanner
          currentKeyword={currentKeyword}
          progressPercent={progressPercent}
          scannedCount={scannedCount}
          filteredOutCount={filteredOutCount}
          pendingReviewCount={pendingReviewCount}
          matchedCount={matchedCount}
          logLines={logLines}
          onNavigateQuality={handleNavigateQuality}
        />
      )}

      {discoveredList.length > 0 && (
        <div ref={feedRef} style={{ marginTop: 24 }}>
          <DiscoveredFeedCard
            discoveredList={discoveredList}
            items={discoveredList}
            onImportSingle={handleImportSingle}
            onImportAll={async () => {
              for (const item of discoveredList.filter(k => k.status === 'DISCOVERED')) {
                await handleImportSingle(item);
              }
            }}
            onInspectDetail={handleInspectDetail}
            onInspect={handleInspectDetail}
            onItemsChange={setDiscoveredList}
          />
        </div>
      )}

      <DirectCrawlModal
        open={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        defaultInput={inspectUsername}
      />
    </div>
  );
}
