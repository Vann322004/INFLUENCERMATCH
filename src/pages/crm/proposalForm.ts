import type { Deal, ProposalUnit } from '../../services/api/dealService';

interface UnitForm { creatorId: string; contentType: string; quantity: number; dueAt: string; checklist: string; maxRevisionRounds: number }
export interface ProposalForm { fee: number; terms: string; units: UnitForm[] }

export function proposalPayload(values: ProposalForm, deal: Deal) {
  if (!Number.isSafeInteger(values.fee) || values.fee <= 0 || !values.terms?.trim() || values.terms.trim().length > 4000) throw new Error('Nhập phí VND hợp lệ và điều khoản hợp tác.');
  if (!values.units?.length || values.units.length > 100) throw new Error('Cần từ 1 đến 100 hạng mục bàn giao.');
  const deliverables: ProposalUnit[] = values.units.map(unit => {
    const acceptanceChecklist = unit.checklist?.split('\n').map(line => line.trim()).filter(Boolean) ?? [];
    const due = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(unit.dueAt ?? '') ? new Date(unit.dueAt + ':00+07:00') : new Date(NaN);
    if (!deal.channels.some(channel => channel.creatorId === unit.creatorId) || !unit.contentType?.trim() || unit.contentType.trim().length > 100
      || !Number.isInteger(unit.quantity) || unit.quantity < 1 || unit.quantity > 100 || !Number.isFinite(due.getTime())
      || !Number.isInteger(unit.maxRevisionRounds) || unit.maxRevisionRounds < 0 || unit.maxRevisionRounds > 10
      || !acceptanceChecklist.length || acceptanceChecklist.length > 50 || acceptanceChecklist.some(line => line.length > 500)
      || new Set(acceptanceChecklist).size !== acceptanceChecklist.length) throw new Error('Kiểm tra kênh, hạn bàn giao, số lượng và tiêu chí nghiệm thu của từng hạng mục.');
    return { creatorId: unit.creatorId, contentType: unit.contentType.trim(), quantity: unit.quantity, dueAt: due.toISOString(), acceptanceChecklist, maxRevisionRounds: unit.maxRevisionRounds };
  });
  if (deliverables.reduce((sum, unit) => sum + unit.quantity, 0) > 1000 || deal.channels.some(channel => !deliverables.some(unit => unit.creatorId === channel.creatorId))) throw new Error('Mỗi kênh trong thỏa thuận cần có hạng mục; tổng số lượng không vượt quá 1.000.');
  return { expectedRevision: deal.revision, fee: values.fee, currency: 'VND', terms: values.terms.trim(), deliverables };
}


export const localDate = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (name: string) => parts.find(part => part.type === name)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
};
