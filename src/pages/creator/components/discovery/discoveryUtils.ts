import type { Creator, BrandCampaignItem, DiscoveryCache } from './types';
import { DOMAIN_CLUSTERS, STOP_WORDS, ALL_CATEGORIES } from './types';
import type { CampaignResponse } from '../../../../types/api/campaign.types';

// Hàm chuyển đổi Creator từ Backend sang format hiển thị trên giao diện
export const mapApiCreatorToUi = (item: any): Creator => {
  const followersNum = item.followers ?? item.follower_count ?? item.followerCount ?? item.followersCount ?? 0;
  const followersText = followersNum >= 1_000_000
    ? `${(followersNum / 1_000_000).toFixed(1)}M`
    : followersNum >= 1_000
    ? `${Math.round(followersNum / 1_000)}K`
    : `${followersNum}`;

  const platformRaw = (item.platform?.toLowerCase() || 'tiktok');
  const platformLower = (platformRaw === 'youtube' || platformRaw === 'instagram' || platformRaw === 'facebook' || platformRaw === 'x')
    ? (platformRaw as 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'x')
    : 'tiktok';
  
  // Chuẩn hóa engagementRate: Backend/crawler lưu dạng số thập phân tỷ lệ (ví dụ 0.0489 = 4.89%)
  const rawEng = item.engagementRate ?? item.engagement_rate ?? item.engagementValue;
  let engVal = 3.5;
  if (typeof rawEng === 'number' && !isNaN(rawEng)) {
    if (rawEng > 0 && rawEng <= 1) {
      engVal = Number((rawEng * 100).toFixed(2));
    } else if (rawEng > 100) {
      engVal = Number((rawEng / 10).toFixed(2));
    } else {
      engVal = Number(rawEng.toFixed(2));
    }
  }

  // Tính ước lượng giá dựa theo quy mô follower thực tế thay vì mock $800
  const calcPrice = (followers: number) => {
    if (followers < 20000) return 150;
    if (followers < 100000) return 400;
    if (followers < 500000) return 850;
    if (followers < 1000000) return 1600;
    return 3200;
  };
  const priceVal = item.avgPriceValue || item.price || item.estimatedFee || item.estimated_fee || calcPrice(followersNum);

  const cleanUsername = (item.userName || item.user_name || item.username || '').replace(/^@+/, '');
  const cleanName = item.displayName || item.display_name || item.name || cleanUsername || 'Creator';
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=4F46E5&color=fff&size=150&bold=true`;
  const avatarRaw = item.avatarUrl || item.avatar_url || item.avatar;
  const avatarUrl = avatarRaw && avatarRaw.trim() !== '' ? avatarRaw : fallbackAvatar;
  const isVerified = Boolean(item.verifiedByInfluencerMatch ?? item.verified ?? item.is_verified ?? item.isVerified);
  const isSimilarFallback = Boolean(item.isSimilarFallback ?? item.isExpandedMatch ?? item.is_fallback ?? item.expandedMatch);
  const priceSource = item.priceSource || item.feeSource || item.fee_source || (item.rateCard ? 'RATE_CARD' : 'ESTIMATED');

  const cleanNiche = item.niche && String(item.niche).toUpperCase() !== 'UNKNOWN' && String(item.niche).trim() !== ''
    ? String(item.niche)
    : 'Lối sống & Sáng tạo';

  // Tách ngành hàng nếu có dấu phẩy hoặc chấm phẩy thành các tag riêng biệt
  const rawParsed = cleanNiche
    .split(/[,;]/)
    .map((s: string) => s.trim())
    .filter(Boolean);
  let categoriesList = rawParsed.length > 0 ? rawParsed : [cleanNiche];

  // Làm sạch các tag rác: nếu KOC là Nông sản / Thực phẩm / Mẹ & Bé / Làm đẹp nhưng bị gắn nhầm "Điện tử"
  const textProfile = `${cleanName} ${cleanUsername} ${cleanNiche} ${item.contentSummary || ''}`.toLowerCase();
  const isFoodNiche = /nông sản|thực phẩm|ẩm thực|nấu ăn|đặc sản|ăn vặt/i.test(textProfile);
  const isBeautyNiche = /mỹ phẩm|làm đẹp|skincare|son|makeup|dưỡng da|chăm sóc da/i.test(textProfile);
  const isMomBabyNiche = /mẹ và bé|bỉm|sữa|trẻ em|gia đình/i.test(textProfile);

  if (isFoodNiche) {
    categoriesList = categoriesList.filter((c) => !/điện tử|tech|công nghệ|thiết bị/i.test(c));
    if (!categoriesList.some((c) => /thực phẩm|ẩm thực|nông sản/i.test(c))) categoriesList.unshift('Thực phẩm & Nông sản');
  } else if (isBeautyNiche) {
    categoriesList = categoriesList.filter((c) => !/điện tử|tech|công nghệ|gia dụng/i.test(c));
    if (!categoriesList.some((c) => /mỹ phẩm|làm đẹp/i.test(c))) categoriesList.unshift('Mỹ phẩm & Làm đẹp');
  } else if (isMomBabyNiche) {
    categoriesList = categoriesList.filter((c) => !/điện tử|tech|công nghệ/i.test(c));
    if (!categoriesList.some((c) => /mẹ và bé/i.test(c))) categoriesList.unshift('Mẹ và Bé');
  }

  const cleanBio = (item.contentSummary && item.contentSummary.trim().toLowerCase() !== 'creator' && item.contentSummary.trim().length > 5)
    ? item.contentSummary.trim()
    : `Nhà sáng tạo nội dung chuyên về ${categoriesList.join(', ')}, chia sẻ trải nghiệm thực tế và truyền cảm hứng ✨`;

  return {
    id: item.creatorId || item.id || item.creator_id || cleanUsername,
    name: cleanName,
    username: cleanUsername,
    avatar: avatarUrl,
    isVerified,
    isSimilarFallback,
    matchRate: 0,
    matchLevel: 'medium',
    matchReason: '',
    platforms: [platformLower],
    categories: categoriesList.slice(0, 3),
    bio: cleanBio,
    followers: followersText,
    followersCount: followersNum,
    engagementRate: `${engVal}%`,
    engagementValue: engVal,
    avgPrice: `$${priceVal.toLocaleString()}`,
    avgPriceValue: priceVal,
    priceSource,
    location: item.location || 'Việt Nam',
    language: 'vi',
    saved: false,
  };
};

// Helper tạo Bio tiếng Việt tự nhiên, có chiều sâu cho KOC khi dữ liệu gốc bị thiếu
export const getDisplayBio = (creator: { bio?: string; categories?: string[]; name?: string; platform?: string }): string => {
  const rawBio = (creator.bio || '').trim();
  if (!rawBio || rawBio.toLowerCase() === 'creator' || rawBio.length < 6) {
    const cats = creator.categories && creator.categories.length > 0
      ? creator.categories.join(', ')
      : 'Làm đẹp & Đời sống';
    return `KOC chuyên sáng tạo nội dung ${cats}, chia sẻ trải nghiệm thực tế và đánh giá chất lượng ✨`;
  }
  return rawBio;
};

// Động cơ tính toán mức độ phù hợp AI (AI Compatibility Engine)
export const computeCreatorMatch = (
  creator: Creator,
  camp: BrandCampaignItem
): { matchRate: number; matchLevel: 'high' | 'medium' | 'low'; reason: string } => {
  // 1. Chuẩn hóa từ khóa chiến dịch
  const rawCampText = [
    camp.name || '',
    camp.tag || '',
    camp.target || '',
    camp.suggestedCategory || '',
  ].join(' ').toLowerCase();

  const cCats = (creator.categories || []).map((c) => c.toLowerCase());
  const primaryCat = cCats[0] || '';
  const cBio = (creator.bio || '').toLowerCase();
  const cName = (creator.name || '').toLowerCase();
  const creatorFullText = `${cCats.join(' ')} ${cBio} ${cName}`;

  // 2. Xác định Domain chính của Campaign
  const isCampTech = DOMAIN_CLUSTERS.TECH.some((kw) => rawCampText.includes(kw));
  const isCampBeauty = DOMAIN_CLUSTERS.BEAUTY.some((kw) => rawCampText.includes(kw));
  const isCampFood = DOMAIN_CLUSTERS.FOOD.some((kw) => rawCampText.includes(kw));
  const isCampFashion = DOMAIN_CLUSTERS.FASHION.some((kw) => rawCampText.includes(kw));
  const isCampFitness = DOMAIN_CLUSTERS.FITNESS.some((kw) => rawCampText.includes(kw));

  // 3. Xác định Domain cốt lõi của Creator (ưu tiên primary category)
  const isCreatorPrimaryTech = DOMAIN_CLUSTERS.TECH.some((kw) => primaryCat.includes(kw));
  const isCreatorPrimaryBeauty = DOMAIN_CLUSTERS.BEAUTY.some((kw) => primaryCat.includes(kw));
  const isCreatorPrimaryFood = DOMAIN_CLUSTERS.FOOD.some((kw) => primaryCat.includes(kw));
  const isCreatorPrimaryFashion = DOMAIN_CLUSTERS.FASHION.some((kw) => primaryCat.includes(kw));
  const isCreatorPrimaryFitness = DOMAIN_CLUSTERS.FITNESS.some((kw) => primaryCat.includes(kw));

  // Tín hiệu thứ cấp từ toàn bộ profile
  const isCreatorTech = DOMAIN_CLUSTERS.TECH.some((kw) => creatorFullText.includes(kw));
  const isCreatorBeauty = DOMAIN_CLUSTERS.BEAUTY.some((kw) => creatorFullText.includes(kw));
  const isCreatorFood = DOMAIN_CLUSTERS.FOOD.some((kw) => creatorFullText.includes(kw));
  const isCreatorFashion = DOMAIN_CLUSTERS.FASHION.some((kw) => creatorFullText.includes(kw));
  const isCreatorFitness = DOMAIN_CLUSTERS.FITNESS.some((kw) => creatorFullText.includes(kw));

  let categoryScore = 15;
  let isStrictMismatch = false;

  if (isCampTech) {
    if (isCreatorPrimaryTech) {
      categoryScore = 46; // Khớp chuẩn xác ngành cốt lõi
    } else if (isCreatorTech && !isCreatorPrimaryFood && !isCreatorPrimaryBeauty) {
      categoryScore = 32; // Ngành bổ trợ công nghệ / gia dụng
    } else if (isCreatorPrimaryFood || isCreatorPrimaryBeauty || isCreatorPrimaryFitness) {
      isStrictMismatch = true; // Lệch ngành nghiêm trọng
      categoryScore = 5;
    } else {
      categoryScore = 15;
    }
  } else if (isCampBeauty) {
    if (isCreatorPrimaryBeauty) {
      categoryScore = 46;
    } else if (isCreatorBeauty && !isCreatorPrimaryFood && !isCreatorPrimaryTech) {
      categoryScore = 32;
    } else if (isCreatorPrimaryTech || isCreatorPrimaryFood) {
      isStrictMismatch = true;
      categoryScore = 5;
    } else {
      categoryScore = 15;
    }
  } else if (isCampFood) {
    if (isCreatorPrimaryFood) {
      categoryScore = 46;
    } else if (isCreatorFood && !isCreatorPrimaryTech) {
      categoryScore = 32;
    } else if (isCreatorPrimaryTech) {
      isStrictMismatch = true;
      categoryScore = 5;
    } else {
      categoryScore = 15;
    }
  } else if (isCampFashion) {
    if (isCreatorPrimaryFashion) {
      categoryScore = 46;
    } else if (isCreatorFashion || isCreatorBeauty) {
      categoryScore = 30;
    } else if (isCreatorPrimaryFood || isCreatorPrimaryTech) {
      isStrictMismatch = true;
      categoryScore = 5;
    } else {
      categoryScore = 15;
    }
  } else {
    // Trường hợp chung: tính theo mức độ trùng lặp từ khóa
    const validWords = rawCampText
      .split(/[\s,./&+-]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
    const matchedCount = validWords.filter((w) => creatorFullText.includes(w)).length;
    categoryScore = matchedCount >= 2 ? 42 : matchedCount === 1 ? 30 : 15;
  }

  // 4. Điểm chất lượng tương tác (Engagement Score): tính động theo mức độ tương tác thực tế
  const eng = creator.engagementValue || 0;
  let engagementScore = 8;
  if (eng >= 30.0) engagementScore = 26;
  else if (eng >= 15.0) engagementScore = 24;
  else if (eng >= 8.0) engagementScore = 21;
  else if (eng >= 4.0) engagementScore = 17;
  else if (eng >= 2.0) engagementScore = 13;

  // 5. Điểm quy mô người theo dõi & Kiểm tra tiêu chuẩn Follower của chiến dịch
  const followers = creator.followersCount || 0;
  if (camp.followerMin && followers < camp.followerMin) {
    return {
      matchRate: 35,
      matchLevel: 'low',
      reason: `Lượng follower (${creator.followers}) thấp hơn mức tối thiểu yêu cầu của chiến dịch (${camp.followerMin.toLocaleString('vi-VN')} followers).`,
    };
  }
  if (camp.followerMax && followers > camp.followerMax) {
    return {
      matchRate: 40,
      matchLevel: 'low',
      reason: `Lượng follower (${creator.followers}) vượt quá mức tối đa yêu cầu của chiến dịch (${camp.followerMax.toLocaleString('vi-VN')} followers).`,
    };
  }
  let followerScore = 10;
  if (followers >= 50000 && followers <= 300000) followerScore = 16;
  else if (followers > 300000 && followers <= 1000000) followerScore = 14;
  else if (followers > 1000000) followerScore = 12;

  const verifyScore = creator.isVerified ? 4 : 1;

  // 6. Seed băm phân hóa mượt mà cho từng Creator
  const seed = `${creator.id || creator.username}_${camp.id || camp.name}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 37 + seed.charCodeAt(i)) & 0x7fffffff;
  }
  const variance = (hash % 11) - 5; // Dao động mượt -5% đến +5%

  let finalScore = categoryScore + engagementScore + followerScore + verifyScore + variance;

  // Xử lý khi lệch ngành nghiêm trọng
  if (isStrictMismatch) {
    finalScore = Math.min(48, Math.max(28, 30 + (hash % 15)));
    const catStr = creator.categories.length > 0 ? creator.categories.slice(0, 2).join(', ') : 'Khác';
    return {
      matchRate: finalScore,
      matchLevel: 'low',
      reason: `Ngành hàng chính (${catStr}) không phù hợp với chiến dịch "${camp.name || 'Công nghệ'}". Đã lọc ra khỏi danh sách ưu tiên.`,
    };
  }

  finalScore = Math.min(97, Math.max(55, finalScore));
  const level: 'high' | 'medium' | 'low' =
    finalScore >= 80 ? 'high' : finalScore >= 65 ? 'medium' : 'low';

  let reason = '';
  if (finalScore >= 90) {
    reason = `Độ phù hợp xuất sắc (${finalScore}%). Đúng ngành hàng cốt lõi, tỷ lệ tương tác ${creator.engagementRate} vượt trội.`;
  } else if (finalScore >= 78) {
    reason = `Phù hợp tốt (${finalScore}%). Kênh có tệp khán giả phù hợp mở rộng và tương tác ổn định ${creator.engagementRate}.`;
  } else {
    reason = `Khả quan (${finalScore}%). Tương tác ${creator.engagementRate}, cần cân nhắc thêm độ phù hợp chi tiết trước khi gửi lời mời.`;
  }

  return { matchRate: finalScore, matchLevel: level, reason };
};

// Map Campaign response sang BrandCampaignItem
export const mapApiCampaignToItem = (c: CampaignResponse | any): BrandCampaignItem => {
  const tag = (c.niches && c.niches.length > 0)
    ? c.niches.join(', ')
    : (c.productService || 'Chiến dịch');
  const target = (c.targetAudiences && c.targetAudiences.length > 0)
    ? c.targetAudiences.join(', ')
    : `Mục tiêu: ${c.objective || 'Tiếp cận'}`;
  const suggestedCategory = (c.niches && c.niches.length > 0)
    ? c.niches[0]
    : c.productService;

  return {
    id: c.id,
    name: c.name,
    tag,
    target,
    suggestedCategory,
    budget: c.budgetMax ? `${(c.budgetMax / 1000000).toFixed(1)}M VND` : undefined,
    followerMin: c.followerMin !== undefined && c.followerMin !== null ? Number(c.followerMin) : undefined,
    followerMax: c.followerMax !== undefined && c.followerMax !== null ? Number(c.followerMax) : undefined,
  };
};

// Global discovery client-side cache
let globalDiscoveryCache: DiscoveryCache | null = null;

export const loadCachedDiscovery = (): DiscoveryCache | null => {
  return null;
};

export const updateDiscoveryCache = (partial: Partial<DiscoveryCache>) => {
  if (!globalDiscoveryCache) {
    globalDiscoveryCache = {
      creators: [],
      campaigns: [],
      matchedCampaign: null,
      selectedCampaignId: null,
      categoriesList: ALL_CATEGORIES,
      lastUpdated: Date.now(),
    };
  }
  globalDiscoveryCache = { ...globalDiscoveryCache, ...partial, lastUpdated: Date.now() };
  try {
    if (partial.creators) {
      localStorage.setItem('IM_DISCOVERY_CREATORS', JSON.stringify(partial.creators));
    }
    if (partial.matchedCampaign !== undefined) {
      if (partial.matchedCampaign) {
        localStorage.setItem('IM_MATCHED_CAMPAIGN', JSON.stringify(partial.matchedCampaign));
      } else {
        localStorage.removeItem('IM_MATCHED_CAMPAIGN');
      }
    }
  } catch {}
};

