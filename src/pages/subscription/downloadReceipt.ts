import type { PaymentInvoice } from '../../types/api/subscription.types';

export interface ReceiptCustomer {
  currentBrand?: { businessName?: string; location?: string } | null;
  storedUser?: { fullName?: string; email?: string } | null;
}

async function loadFont(file: string) {
  const response = await fetch(`${import.meta.env.BASE_URL}fonts/${file}`);
  if (!response.ok) throw new Error('Không tải được phông chữ biên lai');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function downloadReceipt(invoice: PaymentInvoice, customer: ReceiptCustomer = {}) {
  const [{ jsPDF }, regular, bold, logoResponse] = await Promise.all([
    import('jspdf'), loadFont('NotoSans-Regular.ttf'), loadFont('NotoSans-Bold.ttf'),
    fetch(`${import.meta.env.BASE_URL}logo.png`),
  ]);
  if (!logoResponse.ok) throw new Error('Không tải được logo biên lai');
  const logo = new Uint8Array(await logoResponse.arrayBuffer());
  const pdf = new jsPDF({ putOnlyUsedFonts: true, format: [210, 210] });
  pdf.addFileToVFS('NotoSans-Regular.ttf', regular);
  pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  pdf.addFileToVFS('NotoSans-Bold.ttf', bold);
  pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
  pdf.setProperties({ title: `Biên lai ${invoice.code}`, author: 'InfluencerMatch' });
  const text = (value: string, x: number, y: number, width: number, size = 10, strong = false, color = '#334155', align: 'left' | 'right' = 'left') => {
    pdf.setFont('NotoSans', strong ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    const lines: string[] = pdf.splitTextToSize(value.normalize('NFC'), width);
    const isFooter = y >= 194;
    for (const line of lines) {
      if (y > 184 && !isFooter) { pdf.addPage(); y = 24; }
      pdf.text(line, x, y, { align });
      y += size * 0.4 + 1.2;
    }
    return y;
  };
  const rule = (y: number) => {
    pdf.setDrawColor('#E2E8F0');
    pdf.setLineWidth(0.25);
    pdf.line(20, y, 190, y);
  };
  const amount = new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: invoice.currency || 'VND',
  }).format(invoice.amount);

  // Draw document content directly so the PDF remains selectable text.
  const logoInfo = pdf.getImageProperties(logo);
  const logoSize = 19;
  const scale = logoSize / Math.max(logoInfo.width, logoInfo.height);
  pdf.addImage(logo, 'PNG', 20, 12, logoInfo.width * scale, logoInfo.height * scale);
  text('InfluencerMatch', 43, 24, 90, 18, true, '#0F172A');
  text('BIÊN LAI THANH TOÁN', 20, 36, 170, 10, true, '#64748B');
  let y = text(invoice.statusText, 190, 24, 65, 10, true,
    invoice.status === 'success' ? '#047857' : invoice.status === 'pending' ? '#B45309' : '#B91C1C', 'right');
  y = Math.max(41, y + 5);
  rule(y);
  y += 8;

  text('KHÁCH HÀNG', 20, y, 82, 8, true, '#64748B');
  text('THÔNG TIN GIAO DỊCH', 116, y, 74, 8, true, '#64748B');
  y += 7;
  let customerY = y;
  const name = customer.currentBrand?.businessName || customer.storedUser?.fullName;
  if (name) customerY = text(name, 20, customerY, 82, 12, true, '#0F172A');
  if (customer.currentBrand?.location) customerY = text(customer.currentBrand.location, 20, customerY + 2, 82);
  if (customer.storedUser?.email) customerY = text(customer.storedUser.email, 20, customerY + 2, 82);
  if (!name && !customer.currentBrand?.location && !customer.storedUser?.email) {
    customerY = text('Chưa có thông tin', 20, customerY, 82, 10, false, '#64748B');
  }
  let detailsY = text('Mã giao dịch', 116, y, 74, 8, false, '#64748B');
  detailsY = text(invoice.code, 116, detailsY, 74, 10, true, '#0F172A');
  detailsY = text('Ngày giao dịch', 116, detailsY + 2, 74, 8, false, '#64748B');
  detailsY = text(invoice.date, 116, detailsY, 74);
  detailsY = text('Phương thức thanh toán', 116, detailsY + 2, 74, 8, false, '#64748B');
  detailsY = text(invoice.method, 116, detailsY, 74);
  y = Math.max(customerY, detailsY) + 7;
  if (y > 135) { pdf.addPage(); y = 24; }

  pdf.setFillColor('#F1F5F9');
  pdf.roundedRect(20, y, 170, 10, 2, 2, 'F');
  text('DỊCH VỤ / CHU KỲ', 25, y + 6.5, 103, 8, true, '#475569');
  text('THÀNH TIỀN', 185, y + 6.5, 52, 8, true, '#475569', 'right');
  y += 18;
  const planY = text(invoice.planName, 25, y, 100, 12, true, '#0F172A');
  const amountY = text(amount, 185, y, 52, 11, true, '#0F172A', 'right');
  y = Math.max(text(invoice.billingPeriod, 25, planY + 2, 100, 9, false, '#64748B'), amountY) + 4;
  rule(y);
  y += 6;
  if (y > 146) { pdf.addPage(); y = 24; }

  pdf.setFillColor('#EFF6FF');
  pdf.roundedRect(20, y, 170, 22, 3, 3, 'F');
  const totalLabel = invoice.status === 'success' ? 'TỔNG ĐÃ THANH TOÁN' : 'TỔNG SỐ TIỀN GIAO DỊCH';
  text(totalLabel, 26, y + 9, 78, 9, true, '#1E40AF');
  text(invoice.currency || 'VND', 26, y + 16, 78, 8, false, '#64748B');
  text(amount, 184, y + 14, 75, 18, true, '#2563EB', 'right');
  y += 31;
  text('Biên lai ghi nhận thông tin giao dịch dịch vụ trên InfluencerMatch.', 20, y, 170, 9, false, '#64748B');
  text('Chứng từ này không thay thế hóa đơn giá trị gia tăng.', 20, y + 7, 170, 9, false, '#64748B');

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    rule(194);
    text('InfluencerMatch • Biên lai giao dịch', 20, 201, 140, 8, false, '#94A3B8');
    text(`${page} / ${pages}`, 190, 201, 20, 8, false, '#94A3B8', 'right');
  }
  const code = invoice.code.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) || 'giao-dich';
  await pdf.save(`bien-lai-${code}.pdf`, { returnPromise: true });
}
