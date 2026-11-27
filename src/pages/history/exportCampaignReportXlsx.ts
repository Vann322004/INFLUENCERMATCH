import * as XLSX from 'xlsx';
import type { CampaignFinancialSummary, HistoryDetail, HistoryMetric } from '../../types/api/campaignHistory.types';
import { historyDate } from './historyView';

export interface CampaignMetricRowExport {
  key: string;
  label: string;
  group: string;
  formattedValue: string;
  rawValue: number | string;
  coverageText: string;
  missingText: string;
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function fitColumnWidths(rows: (string | number | null | undefined)[][]) {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, colIdx) => {
      const len = cell == null ? 0 : String(cell).length;
      widths[colIdx] = Math.min(56, Math.max(widths[colIdx] ?? 12, len + 3));
    });
  }
  return widths.map(wch => ({ wch }));
}

export function buildCampaignMetricRows(
  detail: HistoryDetail,
  metricLabels: Record<string, string>,
  metricGroup: (key: string) => string,
  formatMetric: (key: string, metric: HistoryMetric) => string,
  reasonMap: Record<string, string>,
): CampaignMetricRowExport[] {
  return Object.entries(detail.report.metrics).map(([key, metric]) => {
    const { coverage, unavailableReasons, availability, value } = metric;
    const coverageText = `${coverage.includedCollaborationCount}/${coverage.requiredCollaborationCount} hợp tác${
      coverage.distinctPostCount > 0 ? ` · ${coverage.distinctPostCount} bài đăng` : ''
    }`;
    const missingText = unavailableReasons.length
      ? unavailableReasons.map(r => reasonMap[r] ?? r).join('; ')
      : '—';
    return {
      key,
      label: metricLabels[key] ?? key,
      group: metricGroup(key),
      formattedValue: formatMetric(key, metric),
      rawValue: availability === 'AVAILABLE' && value != null ? (key === 'roi' ? Number((value * 100).toFixed(2)) : value) : '—',
      coverageText,
      missingText,
    };
  });
}

/** Export campaign-level outcome metrics and Brand-reconciled campaign finance summary to .xlsx. */
export function exportCampaignReportXlsx(
  detail: HistoryDetail,
  rows: CampaignMetricRowExport[],
  latestSummary?: CampaignFinancialSummary,
) {
  const wb = XLSX.utils.book_new();
  const { currentCampaign, report } = detail;

  const sheet1Rows: (string | number)[][] = [
    ['BÁO CÁO HIỆU SUẤT CHIẾN DỊCH', ''],
    ['Chiến dịch', currentCampaign.name || '—'],
    ['Trạng thái', currentCampaign.status || '—'],
    ['Ngày xuất báo cáo', historyDate(new Date().toISOString(), true)],
    ['Hoàn tất / Đang chạy / Đã hủy / Dừng giữa chừng',
      `${report.completedCount} / ${report.unfinishedCount} / ${report.cancelledCount} / ${report.terminatedCount ?? 0}`],
    [],
    ['Nhóm chỉ số', 'Chỉ số', 'Giá trị hiển thị', 'Giá trị số', 'Độ phủ', 'Dữ liệu còn thiếu'],
    ...rows.map(row => [row.group, row.label, row.formattedValue, row.rawValue, row.coverageText, row.missingText]),
  ];

  const wsMetrics = XLSX.utils.aoa_to_sheet(sheet1Rows);
  wsMetrics['!cols'] = fitColumnWidths(sheet1Rows);
  XLSX.utils.book_append_sheet(wb, wsMetrics, 'Chi so doi soat');

  if (latestSummary) {
    const sheet2Rows: (string | number)[][] = [
      ['TỔNG TÀI CHÍNH CAMPAIGN DO BRAND ĐỐI SOÁT', ''],
      ['Phiên bản', `Phiên bản ${latestSummary.revision}`],
      ['Thời điểm ghi nhận', historyDate(latestSummary.recordedAt, true)],
      ['Nguồn số liệu', latestSummary.sourceDescription],
      ['Kỳ đối soát', `${historyDate(latestSummary.periodStart)} – ${historyDate(latestSummary.periodEnd)}`],
      ['GMV tổng Campaign (' + latestSummary.currency + ')', latestSummary.gmv ?? '—'],
      ['Doanh thu tổng Campaign (' + latestSummary.currency + ')', latestSummary.revenue ?? '—'],
      ['Chi phí hợp tác đủ điều kiện (' + latestSummary.currency + ')', latestSummary.actualCost ?? '—'],
      ['ROAS Campaign (x)', latestSummary.roas != null ? Number(latestSummary.roas.toFixed(2)) : '—'],
      ['ROI Campaign (%)', latestSummary.roi != null ? Number((latestSummary.roi * 100).toFixed(2)) : '—'],
      ['Bằng chứng đối soát', latestSummary.evidenceUrl || '—'],
    ];
    const wsFinance = XLSX.utils.aoa_to_sheet(sheet2Rows);
    wsFinance['!cols'] = fitColumnWidths(sheet2Rows);
    XLSX.utils.book_append_sheet(wb, wsFinance, 'Tai chinh Campaign');
  }

  const slug = sanitizeFilenamePart(currentCampaign.name || 'campaign') || 'campaign';
  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `bao-cao-chien-dich-${slug}-${dateStamp}.xlsx`);
}
