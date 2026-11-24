import type { PaymentInvoice } from '../../types/api/subscription.types';

export interface ReceiptCustomer {
  currentBrand?: { businessName?: string; location?: string } | null;
  storedUser?: { fullName?: string; email?: string } | null;
}

// In-memory cache for fonts and logo to speed up repeated downloads and prevent redundant fetches
let cachedRegularFont: string | null = null;
let cachedBoldFont: string | null = null;
let cachedLogo: Uint8Array | null = null;

function resolveCandidateUrls(relativePath: string): string[] {
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const relativeUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${cleanPath}`;
  const productionWwwUrl = `https://www.influencermatch.site/${cleanPath}`;

  const candidates: string[] = [];

  // When loaded on production apex domain (influencermatch.site), prioritize www.influencermatch.site
  // because Vercel 308 redirects apex assets to www without Access-Control-Allow-Origin headers.
  if (typeof window !== 'undefined' && window.location.hostname === 'influencermatch.site') {
    candidates.push(productionWwwUrl);
    candidates.push(relativeUrl);
  } else {
    candidates.push(relativeUrl);
    candidates.push(productionWwwUrl);
  }

  const rootUrl = `/${cleanPath}`;
  if (!candidates.includes(rootUrl)) {
    candidates.push(rootUrl);
  }

  return candidates;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

async function loadFontAsBase64(filename: string): Promise<string | null> {
  const urls = resolveCandidateUrls(`fonts/${filename}`);
  for (const url of urls) {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 1000) {
          return bufferToBase64(buffer);
        }
      }
    } catch (err) {
      console.warn(`[Receipt] Không thể tải phông chữ từ ${url}:`, err);
    }
  }
  return null;
}

async function loadLogoBytes(): Promise<Uint8Array | null> {
  const urls = resolveCandidateUrls('logo.png');
  for (const url of urls) {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 100) {
          return new Uint8Array(buffer);
        }
      }
    } catch (err) {
      console.warn(`[Receipt] Không thể tải logo từ ${url}:`, err);
    }
  }
  return null;
}

export async function downloadReceipt(invoice: PaymentInvoice, customer: ReceiptCustomer = {}) {
  // Parallel fetch fonts and logo if not already cached
  const [{ jsPDF }, regularFont, boldFont, logoBytes] = await Promise.all([
    import('jspdf'),
    cachedRegularFont ? Promise.resolve(cachedRegularFont) : loadFontAsBase64('NotoSans-Regular.ttf'),
    cachedBoldFont ? Promise.resolve(cachedBoldFont) : loadFontAsBase64('NotoSans-Bold.ttf'),
    cachedLogo ? Promise.resolve(cachedLogo) : loadLogoBytes(),
  ]);

  if (regularFont) cachedRegularFont = regularFont;
  if (boldFont) cachedBoldFont = boldFont;
  if (logoBytes) cachedLogo = logoBytes;

  const pdf = new jsPDF({ putOnlyUsedFonts: true, format: [210, 210] });

  const hasRegularFont = Boolean(cachedRegularFont);
  const hasBoldFont = Boolean(cachedBoldFont);

  if (cachedRegularFont) {
    try {
      pdf.addFileToVFS('NotoSans-Regular.ttf', cachedRegularFont);
      pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    } catch (e) {
      console.warn('[Receipt] Lỗi đăng ký NotoSans-Regular:', e);
    }
  }

  if (cachedBoldFont) {
    try {
      pdf.addFileToVFS('NotoSans-Bold.ttf', cachedBoldFont);
      pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    } catch (e) {
      console.warn('[Receipt] Lỗi đăng ký NotoSans-Bold:', e);
    }
  }

  const primaryFont = hasRegularFont ? 'NotoSans' : 'helvetica';
  const boldFontName = hasBoldFont ? 'NotoSans' : 'helvetica';

  pdf.setProperties({ title: `Biên lai ${invoice.code}`, author: 'InfluencerMatch' });

  const text = (
    value: string,
    x: number,
    y: number,
    width: number,
    size = 10,
    strong = false,
    color = '#334155',
    align: 'left' | 'right' = 'left',
  ) => {
    pdf.setFont(strong ? boldFontName : primaryFont, strong ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color);

    // If custom unicode font is unavailable, strip Vietnamese tones for Helvetica to prevent corrupt glyphs
    const textToPrint = hasRegularFont ? value.normalize('NFC') : removeVietnameseTones(value);
    const lines: string[] = pdf.splitTextToSize(textToPrint, width);
    const isFooter = y >= 194;
    for (const line of lines) {
      if (y > 184 && !isFooter) {
        pdf.addPage();
        y = 24;
      }
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
    style: 'currency',
    currency: invoice.currency || 'VND',
  }).format(invoice.amount || 0);

  // Draw logo if available, or fall back to brand title offset
  let brandTitleX = 20;
  if (cachedLogo) {
    try {
      const logoInfo = pdf.getImageProperties(cachedLogo);
      const logoSize = 19;
      const scale = logoSize / Math.max(logoInfo.width, logoInfo.height);
      pdf.addImage(cachedLogo, 'PNG', 20, 12, logoInfo.width * scale, logoInfo.height * scale);
      brandTitleX = 43;
    } catch (e) {
      console.warn('[Receipt] Lỗi chèn logo vào PDF:', e);
      brandTitleX = 20;
    }
  }

  text('InfluencerMatch', brandTitleX, 24, 90, 18, true, '#0F172A');
  text('BIÊN LAI THANH TOÁN', 20, 36, 170, 10, true, '#64748B');
  let y = text(
    invoice.statusText || 'Đã thanh toán',
    190,
    24,
    65,
    10,
    true,
    invoice.status === 'success' ? '#047857' : invoice.status === 'pending' ? '#B45309' : '#B91C1C',
    'right',
  );
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
  detailsY = text(invoice.code || '—', 116, detailsY, 74, 10, true, '#0F172A');
  detailsY = text('Ngày giao dịch', 116, detailsY + 2, 74, 8, false, '#64748B');
  detailsY = text(invoice.date || '—', 116, detailsY, 74);
  detailsY = text('Phương thức thanh toán', 116, detailsY + 2, 74, 8, false, '#64748B');
  detailsY = text(invoice.method || '—', 116, detailsY, 74);
  y = Math.max(customerY, detailsY) + 7;
  if (y > 135) {
    pdf.addPage();
    y = 24;
  }

  pdf.setFillColor('#F1F5F9');
  pdf.roundedRect(20, y, 170, 10, 2, 2, 'F');
  text('DỊCH VỤ / CHU KỲ', 25, y + 6.5, 103, 8, true, '#475569');
  text('THÀNH TIỀN', 185, y + 6.5, 52, 8, true, '#475569', 'right');
  y += 18;
  const planY = text(invoice.planName || 'Gói dịch vụ', 25, y, 100, 12, true, '#0F172A');
  const amountY = text(amount, 185, y, 52, 11, true, '#0F172A', 'right');
  y = Math.max(text(invoice.billingPeriod || '—', 25, planY + 2, 100, 9, false, '#64748B'), amountY) + 4;
  rule(y);
  y += 6;
  if (y > 146) {
    pdf.addPage();
    y = 24;
  }

  pdf.setFillColor('#F3E8FF');
  pdf.roundedRect(20, y, 170, 22, 3, 3, 'F');
  const totalLabel = invoice.status === 'success' ? 'TỔNG ĐÃ THANH TOÁN' : 'TỔNG SỐ TIỀN GIAO DỊCH';
  text(totalLabel, 26, y + 9, 78, 9, true, '#5B21B6');
  text(invoice.currency || 'VND', 26, y + 16, 78, 8, false, '#64748B');
  text(amount, 184, y + 14, 75, 18, true, '#7C3AED', 'right');
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

  const rawCode = invoice.code || 'giao-dich';
  const code = rawCode.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) || 'giao-dich';
  const filename = `bien-lai-${code}.pdf`;

  try {
    await pdf.save(filename, { returnPromise: true });
  } catch (saveErr) {
    console.warn('[Receipt] pdf.save promise failed, attempting fallback blob download:', saveErr);
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  }
}
