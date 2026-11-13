import type { Deliverable, ExecutionSnapshot, OutcomeRevision } from '../../types/api/collaboration.types';
import { currentPublication, measurementFor, metrics } from './ExecutionForms';

export function sortDeliverables(deliverables: Deliverable[]) {
  const deadline = (unit: Deliverable) => {
    const parsed = Date.parse(unit.dueAt);
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
  };
  return [...deliverables].sort((a, b) => deadline(a) - deadline(b) || a.id.localeCompare(b.id));
}

export function acceptanceReadiness(snapshot: ExecutionSnapshot, latest?: OutcomeRevision) {
  const issues: { unit?: Deliverable; message: string }[] = [];
  const missingMeasurements: Deliverable[] = [];
  const hasPositiveCost = latest?.payload.currency === 'VND' && (latest.calculation.actualCost ?? 0) > 0;
  const costConfirmed = hasPositiveCost && latest?.payload.financialConfirmed === true;

  if (!snapshot.deliverables.length) issues.push({ message: 'Chưa có kế hoạch ấn phẩm.' });
  for (const unit of sortDeliverables(snapshot.deliverables)) {
    const missing = [];
    if (unit.status !== 'APPROVED') {
      missing.push({
        PENDING: 'Chưa có bản nháp', CHANGES_REQUESTED: 'Đang chờ bản chỉnh sửa', SUBMITTED: 'Bản nháp chờ duyệt',
      }[unit.status]);
    }
    const publication = currentPublication(unit);
    if (!publication) {
      missing.push('Thiếu link bài đăng');
    } else {
      if (publication.earlyPublication && !publication.exceptionAcknowledged) missing.push('Chưa xác nhận đăng sớm');
      const measurement = measurementFor(latest?.payload, unit);
      if (!measurement?.periodStart || !measurement.periodEnd) {
        missing.push('Thiếu kỳ đo cho bài đăng hiện hành');
        missingMeasurements.push(unit);
      } else if (!metrics.every(metric => measurement[metric] != null || measurement.unavailableMetrics?.includes(metric))) {
        missing.push('Chưa khai đủ chỉ số cho bài đăng hiện hành');
        missingMeasurements.push(unit);
      }
    }
    if (missing.length) issues.push({ unit, message: missing.join(' · ') });
  }
  if (!costConfirmed) issues.push({ message: hasPositiveCost
    ? 'Chi phí thực tế đã được lưu. Brand cần xác nhận chi phí này.'
    : 'Cần khai báo và xác nhận chi phí thực tế dương bằng VND.' });
  return { issues, missingMeasurements, hasPositiveCost, costConfirmed };
}
