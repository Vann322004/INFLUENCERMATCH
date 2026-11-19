import type { LiveCrawlResult } from '../../../../types/api/crawler.types';

// Kiểm tra tài khoản shop, bán sỉ, kho hàng
export function isShopAccount(username: string, displayName?: string, bio?: string): boolean {
  const text = `${username} ${displayName || ''} ${bio || ''}`.toLowerCase();
  const shopPatterns = [
    /(\b|_|\.)shop(\b|_|\.|\d|$)/i,
    /(\b|_|\.)store(\b|_|\.|\d|$)/i,
    /(\b|_|\.)boutique(\b|_|\.|\d|$)/i,
    /(\b|_|\.)tongkho(\b|_|\.|\d|$)/i,
    /(\b|_|\.)khohang(\b|_|\.|\d|$)/i,
    /(\b|_|\.)bansi(\b|_|\.|\d|$)/i,
    /(\b|_|\.)sile(\b|_|\.|\d|$)/i,
    /(\b|_|\.)order(\b|_|\.|\d|$)/i,
    /bán sỉ/i,
    /sỉ lẻ/i,
    /tổng kho/i,
    /kho buôn/i,
    /cửa hàng/i,
    /chuyên sỉ/i,
    /giỏ hàng/i,
    /bấm vào giỏ hàng/i,
    /đơn hàng/i,
    /từng đơn hàng/i,
    /chốt đơn/i,
    /lên đơn/i,
    /đặt hàng/i,
    /mua hàng/i,
    /hoàn tiền/i,
    /1 đổi 1/i,
    /lỗi 1/i,
    /đổi trả/i,
    /bao đổi trả/i,
    /ủng hộ em/i,
    /ủng hộ shop/i,
    /hàng có sẵn/i,
    /sẵn kho/i,
    /sẵn hàng/i,
    /xả kho/i,
    /thanh lý/i,
    /ship cod/i,
    /đồng kiểm/i,
    /cho xem hàng/i,
    /kiểm tra hàng/i,
    /freeship/i,
    /báo giá/i,
    /giá sỉ/i,
  ];
  return shopPatterns.some((pattern) => pattern.test(text));
}

export interface Tier0FilterResult {
  passedResults: LiveCrawlResult[];
  shopFilteredCount: number;
  lowFollowersCount: number;
  shopRemovedNames: string[];
  reviewPendingCandidates: { username: string; platform: string }[];
}

export function filterTier0Candidates(rawResults: LiveCrawlResult[]): Tier0FilterResult {
  let shopFilteredCount = 0;
  let lowFollowersCount = 0;
  const passedResults: LiveCrawlResult[] = [];
  const shopRemovedNames: string[] = [];
  const reviewPendingCandidates: { username: string; platform: string }[] = [];

  for (const r of rawResults) {
    const uname = r.username || '';
    const dname = r.display_name || '';
    const bio = r.bio || '';
    const followers = r.followers || 0;

    // 1. Loại bỏ tài khoản Shop / thương mại
    if (isShopAccount(uname, dname, bio)) {
      shopFilteredCount++;
      shopRemovedNames.push(`@${uname.replace(/^@/, '')}`);
      reviewPendingCandidates.push({ username: uname, platform: r.platform || 'TIKTOK' });
      continue;
    }

    // 2. Loại bỏ tài khoản dưới 7.000 followers
    if (followers < 7000) {
      lowFollowersCount++;
      reviewPendingCandidates.push({ username: uname, platform: r.platform || 'TIKTOK' });
      continue;
    }

    // 3. Loại bỏ nếu Backend Rule Engine từ chối (Brand / Shop / Spam)
    if (r.decision === 'AUTO_REJECT' || r.primary_type === 'BRAND' || r.primary_type === 'SPAM') {
      shopFilteredCount++;
      shopRemovedNames.push(`@${uname.replace(/^@/, '')}`);
      reviewPendingCandidates.push({ username: uname, platform: r.platform || 'TIKTOK' });
      continue;
    }

    passedResults.push(r);
  }

  return {
    passedResults,
    shopFilteredCount,
    lowFollowersCount,
    shopRemovedNames,
    reviewPendingCandidates,
  };
}

