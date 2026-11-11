import React, { useState, useEffect } from 'react';
import { Card, message, Spin } from 'antd';
import {
  crawlerService,
  DEFAULT_CRAWL_CATEGORIES,
} from '../../../../services/api/crawlerService';
import type {
  CrawlPlatform,
  BatchCrawlResponse,
  CrawlCategory,
} from '../../../../types/api/crawler.types';
import BatchCrawlConfigCard from './batch/BatchCrawlConfigCard';
import BatchCrawlTable from './batch/BatchCrawlTable';

export default function BatchCrawlTab() {
  const [platform, setPlatform] = useState<CrawlPlatform>('TIKTOK');
  const [mode, setMode] = useState<'category' | 'custom'>('category');
  const [categories, setCategories] = useState<CrawlCategory[]>(DEFAULT_CRAWL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('BEAUTY');
  const [customUsernames, setCustomUsernames] = useState<string>('');
  const [maxChannels, setMaxChannels] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [batchResponse, setBatchResponse] = useState<BatchCrawlResponse | null>(null);

  useEffect(() => {
    crawlerService
      .getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
          setSelectedCategory((prev) => (cats.some((c) => c.id === prev) ? prev : cats[0].id));
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi tải danh mục từ Crawler API:', err);
      });
  }, []);

  const handleStartBatchCrawl = async () => {
    let usernamesToCrawl: string[] = [];

    if (mode === 'custom') {
      usernamesToCrawl = customUsernames
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter(Boolean);

      if (usernamesToCrawl.length === 0) {
        message.warning('Vui lòng nhập ít nhất 1 username hoặc link creator!');
        return;
      }
    }

    setLoading(true);
    setBatchResponse(null);

    try {
      const res = await crawlerService.batchCrawl({
        platform,
        category: mode === 'category' ? selectedCategory : undefined,
        usernames: mode === 'custom' ? usernamesToCrawl : undefined,
        maxChannels,
      });

      setBatchResponse(res);
      const successCount = res?.summary?.success_count ?? res?.results?.length ?? 0;
      const totalReq = res?.summary?.total_requested ?? maxChannels;
      message.success(`Hoàn tất cào hàng loạt! (${successCount}/${totalReq} kênh thành công)`);
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi thực hiện cào hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  const handleImportAll = () => {
    if (!batchResponse || !batchResponse.results || batchResponse.results.length === 0) return;
    message.loading({
      content: `Đang lưu ${batchResponse.results.length} KOC vào danh mục...`,
      key: 'batch_import',
    });
    setTimeout(() => {
      message.success({
        content: `Đã lưu thành công ${batchResponse.results.length} KOC vào hệ thống!`,
        key: 'batch_import',
      });
    }, 700);
  };

  return (
    <div>
      {/* 1. Bảng điều khiển cấu hình cào */}
      <BatchCrawlConfigCard
        platform={platform}
        mode={mode}
        categories={categories}
        selectedCategory={selectedCategory}
        customUsernames={customUsernames}
        maxChannels={maxChannels}
        loading={loading}
        onPlatformChange={setPlatform}
        onModeChange={setMode}
        onSelectCategory={setSelectedCategory}
        onCustomUsernamesChange={setCustomUsernames}
        onMaxChannelsChange={setMaxChannels}
        onStartBatchCrawl={handleStartBatchCrawl}
      />

      {/* Loading state trong khi cào hàng loạt */}
      {loading && (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '36px 20px', marginBottom: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>
            Đang thực hiện cào hàng loạt {maxChannels} kênh theo {mode === 'category' ? `ngành ${selectedCategory}` : 'danh sách'}...
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
            Hệ thống đang trích xuất dữ liệu bài đăng thực tế và tính toán chỉ số tương tác (khoảng 5 - 15 giây)...
          </div>
        </Card>
      )}

      {/* 2. Bảng kết quả tổng hợp */}
      {batchResponse && !loading && (
        <BatchCrawlTable
          batchResponse={batchResponse}
          onImportAll={handleImportAll}
        />
      )}
    </div>
  );
}
