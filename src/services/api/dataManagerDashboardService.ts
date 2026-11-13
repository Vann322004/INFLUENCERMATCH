import apiClient from '../apiClient';
import { createDataManagerQuery } from '../dataManagerCache';
import type { CreatorMasterSummary, CrawlerTrends, NicheStatistic } from '../../types/api/dataManagerDashboard.types';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};

function payload(body: unknown): unknown {
  const envelope = record(body);
  if (envelope.success === false) throw new Error('Backend không thể cung cấp dữ liệu tổng hợp.');
  return Object.prototype.hasOwnProperty.call(envelope, 'data') ? envelope.data : body;
}

function count(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Dữ liệu ' + field + ' không hợp lệ.');
  }
  return value;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Dữ liệu ' + field + ' không hợp lệ.');
  return value;
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Backend không trả về danh sách dữ liệu hợp lệ.');
  return value;
}

export const dataManagerDashboardService = {
  getCreatorMasterSummary: createDataManagerQuery('creator-master-summary', async (): Promise<CreatorMasterSummary> => {
    const { data } = await apiClient.get('/data/creator-masters/summary');
    const summary = record(payload(data));
    return {
      totalMasters: count(summary.totalMasters ?? summary.total_masters, 'totalMasters'),
      claimedChannelsCount: count(summary.claimedChannelsCount ?? summary.claimed_channels_count, 'claimedChannelsCount'),
      unclaimedChannelsCount: count(summary.unclaimedChannelsCount ?? summary.unclaimed_channels_count, 'unclaimedChannelsCount'),
      duplicateCandidatesCount: count(summary.duplicateCandidatesCount ?? summary.duplicate_candidates_count, 'duplicateCandidatesCount'),
    };
  }, { ttl: 60000, tags: ['creator-data'] }),

  getNicheStatistics: createDataManagerQuery('niche-statistics', async (): Promise<NicheStatistic[]> => {
    const { data } = await apiClient.get('/data/niches/stats');
    return list(payload(data)).map(value => {
      const item = record(value);
      const percentage = item.percentage;
      if (typeof percentage !== 'number' || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        throw new Error('Dữ liệu percentage không hợp lệ.');
      }
      return {
        niche: text(item.niche, 'niche'),
        name: text(item.name, 'name'),
        creatorCount: count(item.creatorCount ?? item.creator_count, 'creatorCount'),
        percentage,
      };
    });
  }, { ttl: 60000, tags: ['creator-data'] }),

  getCrawlerTrends(days: 7 | 30): Promise<CrawlerTrends> { return trendQueries[days](); },
  getCrawlerTrendsQuery(days: 7 | 30) { return trendQueries[days]; },
};

async function fetchCrawlerTrends(days: 7 | 30): Promise<CrawlerTrends> {
    const { data: body } = await apiClient.get('/data/crawler/trends', { params: { days } });
    const data = payload(body);
    const detail = record(data);
    const rows = list(Array.isArray(data) ? data : detail.items);
    const items = rows.map(value => {
      const item = record(value);
      const date = text(item.date, 'date');
      const parsed = new Date(date + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
        throw new Error('Ngày trong dữ liệu xu hướng không hợp lệ.');
      }
      return {
        date,
        ingestedCount: count(item.ingestedCount ?? item.ingested_count, 'ingestedCount'),
        successCount: count(item.successCount ?? item.success_count, 'successCount'),
        failedCount: count(item.failedCount ?? item.failed_count, 'failedCount'),
      };
    });
    const envelope = record(body);
    const metadata = { ...record(envelope.meta), ...record(envelope.metadata),
      ...record(detail.meta), ...record(detail.metadata), ...detail };
    const declaredSource = metadata.source ?? envelope.source;
    const rowSources = [...new Set(rows.map(row => record(row).source).filter((source): source is string => typeof source === 'string' && !!source.trim()))];
    const declaredFallback = metadata.isFallback ?? metadata.fallback ?? envelope.isFallback ?? envelope.fallback;
    const rowFallbacks = rows.map(row => record(row).isFallback ?? record(row).fallback).filter(value => typeof value === 'boolean');
    return {
      items,
      source: typeof declaredSource === 'string' && declaredSource.trim() ? declaredSource : rowSources.join(', ') || null,
      isFallback: typeof declaredFallback === 'boolean' ? declaredFallback : rowFallbacks.length ? rowFallbacks.some(Boolean) : null,
    };
}

const trendQueries = {
  7: createDataManagerQuery('crawler-trends:7', () => fetchCrawlerTrends(7), { ttl: 60000, tags: ['crawler-data'] }),
  30: createDataManagerQuery('crawler-trends:30', () => fetchCrawlerTrends(30), { ttl: 60000, tags: ['crawler-data'] }),
};
