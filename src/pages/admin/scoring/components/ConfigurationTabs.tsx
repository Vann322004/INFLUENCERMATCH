import { useEffect, useRef } from 'react';
import { Card, Tabs, Grid } from 'antd';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';
import WeightingTab from './WeightingTab';
import CalibrationTab from './CalibrationTab';
import RerankingTab from './RerankingTab';

interface Props { config: RecommendationConfigResponseDto; activeTab: string; setActiveTab: (key: string) => void; }

export default function ConfigurationTabs({ config: currentConfig, activeTab, setActiveTab }: Props) {
  const screens = Grid.useBreakpoint();
  const inspectorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inspectorRef.current?.querySelector('.ant-tabs-tab-active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab, currentConfig]);
  return (
    <Card
      ref={inspectorRef}
      onFocusCapture={(event) => {
        // rc-tabs resets native scrollLeft on focus; retain the mobile scroll position.
        if (!screens.md && event.target.getAttribute('role') === 'tab') {
          event.stopPropagation();
          event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }}
      bordered={false}
      style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)', border: '1px solid #EEF0F6', marginBottom: 20 }}
      styles={{ body: { padding: 0 } }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="line"
        tabBarStyle={{ padding: '0 20px', marginBottom: 0, borderBottom: '1px solid #EEF0F6' }}
        items={[
          // TAB 1: TRỌNG SỐ VÀ CRITIC
          {
            key: 'weighting',
            label: <span style={{ fontWeight: 600 }}>Trọng số và CRITIC</span>,
            children: <WeightingTab config={currentConfig} />,
          },

          // TAB 2: CHUẨN HÓA VÀ KIỂM SOÁT DỮ LIỆU
          {
            key: 'calibration',
            label: <span style={{ fontWeight: 600 }}>Chuẩn hóa và kiểm soát dữ liệu</span>,
            children: <CalibrationTab config={currentConfig} />,
          },

          // TAB 3: MMR VÀ PHẠM VI TRIỂN KHAI
          {
            key: 'reranking',
            label: <span style={{ fontWeight: 600 }}>MMR và phạm vi triển khai</span>,
            children: <RerankingTab config={currentConfig} />,
          },
        ]}
      />
    </Card>
  );
}
