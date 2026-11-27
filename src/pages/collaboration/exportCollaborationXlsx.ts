import * as XLSX from 'xlsx';
import type {
  Acceptance,
  CollaborationDetail,
  Deliverable,
  ExecutionSnapshot,
  OutcomeRevision,
} from '../../types/api/collaboration.types';
import { currentPublication, formatDate, measurementFor } from './ExecutionForms';

interface ExportCollaborationXlsxParams {
  summary: CollaborationDetail;
  snapshot: ExecutionSnapshot;
  brand: boolean;
  statusLabel: string;
  channelsText: string;
  deliverableLabel: (unit: Deliverable) => string;
  unitStatusLabel: (status: Deliverable['status']) => string;
  latest?: OutcomeRevision;
  accepted?: Acceptance;
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
      widths[colIdx] = Math.min(54, Math.max(widths[colIdx] ?? 12, len + 3));
    });
  }
  return widths.map(wch => ({ wch }));
}

function numOrDash(value: number | null | undefined): number | string {
  return value == null ? '—' : value;
}

/** Export collaboration summary, finance metrics (Brand only), and post metrics to an .xlsx workbook. */
export function exportCollaborationXlsx({
  summary,
  snapshot,
  brand,
  statusLabel,
  channelsText,
  deliverableLabel,
  unitStatusLabel,
  latest,
  accepted,
}: ExportCollaborationXlsxParams) {
  const wb = XLSX.utils.book_new();
  const isAccepted = !!(latest && accepted?.outcomeRevision === latest.revision);
  const currency = latest?.payload.currency || snapshot.currency || 'VND';

  const summaryRows: (string | number)[][] = [
    ['BÁO CÁO HỢP TÁC & HIỆU QUẢ', ''],
    ['Ngày xuất báo cáo', formatDate(new Date().toISOString())],
    [],
    ['1. THÔNG TIN CHUNG', ''],
    ['Chiến dịch', summary.campaignName || '—'],
    [brand ? 'Creator đối tác' : 'Nhãn hàng', (brand ? summary.creatorName : summary.brandName) || '—'],
    ['Kênh thực hiện', channelsText || '—'],
    ['Trạng thái hợp tác', statusLabel],
    ['Trạng thái nghiệm thu', isAccepted ? 'Đã nghiệm thu' : 'Chưa nghiệm thu'],
    ['Phí đã chốt (' + currency + ')', snapshot.agreedFee ?? '—'],
  ];

  if (brand) {
    summaryRows.push(
      [],
      ['2. TÀI CHÍNH & HIỆU QUẢ', ''],
      ['Chi phí thực tế (' + currency + ')', numOrDash(latest?.calculation.actualCost)],
      ['Tổng giá trị đơn hàng - GMV (' + currency + ')', numOrDash(latest?.payload.gmv)],
      ['Doanh thu (' + currency + ')', numOrDash(latest?.payload.revenue)],
      ['Kỳ đo tài chính', latest?.payload.periodStart && latest?.payload.periodEnd
        ? `${formatDate(latest.payload.periodStart)} – ${formatDate(latest.payload.periodEnd)}`
        : '—'],
      ['ROAS (x)', latest?.calculation.roas != null ? Number(latest.calculation.roas.toFixed(2)) : '—'],
      ['ROI (%)', latest?.calculation.roi != null ? Number((latest.calculation.roi * 100).toFixed(2)) : '—'],
      ['CPM (' + currency + ')', latest?.calculation.cpm != null ? Math.round(latest.calculation.cpm) : '—'],
      ['CPE (' + currency + ')', latest?.calculation.cpe != null ? Math.round(latest.calculation.cpe) : '—'],
    );

    if (latest?.payload.costs?.length) {
      summaryRows.push([], ['3. CHI TIẾT KHOẢN CHI', 'Số tiền (' + currency + ')']);
      for (const cost of latest.payload.costs) {
        summaryRows.push([cost.description, cost.amount]);
      }
    }
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = fitColumnWidths(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong quan & Tai chinh');

  const postHeader = [
    'STT',
    'Ấn phẩm',
    'Loại nội dung',
    'Hạn nộp',
    'Trạng thái duyệt',
    'Link bài đăng',
    'Ngày ghi nhận bài',
    'Kỳ đo',
    'Lượt xem',
    'Lượt nhấp',
    'Lượt thích',
    'Bình luận',
    'Chia sẻ',
  ];

  const postRows: (string | number)[][] = [postHeader];
  let totalViews = 0;
  let totalClicks = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;

  snapshot.deliverables.forEach((unit, idx) => {
    const pub = currentPublication(unit);
    const post = measurementFor(latest?.payload, unit);
    totalViews += post?.views ?? 0;
    totalClicks += post?.clicks ?? 0;
    totalLikes += post?.likes ?? 0;
    totalComments += post?.comments ?? 0;
    totalShares += post?.shares ?? 0;

    postRows.push([
      idx + 1,
      deliverableLabel(unit),
      unit.contentType || '—',
      formatDate(unit.dueAt),
      unitStatusLabel(unit.status),
      pub?.url || '—',
      pub?.receivedAt ? formatDate(pub.receivedAt) : '—',
      post?.periodStart && post?.periodEnd ? `${formatDate(post.periodStart)} – ${formatDate(post.periodEnd)}` : '—',
      numOrDash(post?.views),
      numOrDash(post?.clicks),
      numOrDash(post?.likes),
      numOrDash(post?.comments),
      numOrDash(post?.shares),
    ]);
  });

  if (snapshot.deliverables.length > 0) {
    postRows.push([
      '',
      'Tổng cộng',
      '',
      '',
      '',
      '',
      '',
      '',
      totalViews,
      totalClicks,
      totalLikes,
      totalComments,
      totalShares,
    ]);
  }

  const wsPosts = XLSX.utils.aoa_to_sheet(postRows);
  wsPosts['!cols'] = fitColumnWidths(postRows);
  XLSX.utils.book_append_sheet(wb, wsPosts, 'Ket qua bai dang');

  const campaignSlug = sanitizeFilenamePart(summary.campaignName || 'campaign') || 'campaign';
  const partnerSlug = sanitizeFilenamePart((brand ? summary.creatorName : summary.brandName) || 'partner') || 'partner';
  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `bao-cao-hop-tac-${campaignSlug}-${partnerSlug}-${dateStamp}.xlsx`);
}
