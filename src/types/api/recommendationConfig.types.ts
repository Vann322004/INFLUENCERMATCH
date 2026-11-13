/**
 * Types for DM-04: Tra cứu Cấu hình Thuật toán Four-Memory (View Recommendation Configuration)
 * Corresponds to Backend DTO: com.influencermatch.backend.recommendation.dto.RecommendationConfigResponseDto
 */

export interface HalfSaturationConfig {
  erViewsK: Record<string, number>;
  erFollowersK: Record<string, number>;
  vrK: Record<string, number>;
  defaultFallbackK: number;
}

export interface StabilityConfig {
  stabMissingPolicyFloor: number;
  description: string;
}

export interface OutlierSanityConfig {
  erExtremeOutlierThreshold: number;
  description: string;
}

export interface DynamicWeightingConfig {
  defaultLambda: number;
  minPoolSizeForCritic: number;
  blendFormula: string;
  fallbackMode: string;
  interpretationPolicy: string;
  canonicalObjectiveWeights: Record<string, number[]>;
}

export interface DiversityRerankingConfig {
  defaultMmrLambda: number;
  mmrFormula: string;
  intraBucketMmrStatus: string;
}

export interface RecommendationConfigResponseDto {
  engineVersion: string;
  calibrationVersion: string;
  dynamicallyMutable: boolean;
  flowName: string;
  halfSaturation: HalfSaturationConfig;
  stability: StabilityConfig;
  outlierSanity: OutlierSanityConfig;
  dynamicWeighting: DynamicWeightingConfig;
  diversityReranking: DiversityRerankingConfig;
  futureScope: string[];
}

/**
 * Fixture đóng băng mặc định (Derived directly from Backend Single Source of Truth)
 * Phục vụ hiển thị an toàn khi Backend đang khởi động hoặc offline.
 */
export const FROZEN_RECOMMENDATION_CONFIG: RecommendationConfigResponseDto = {
  engineVersion: 'Four-Memory TOPSIS Engine v1.0',
  calibrationVersion: 'v1.0-mvp',
  dynamicallyMutable: false,
  flowName: 'DM-04: Tra cứu Cấu hình Thuật toán Four-Memory (View Recommendation Configuration)',
  halfSaturation: {
    erViewsK: {
      TIKTOK: 0.08,
      INSTAGRAM: 0.05,
      FACEBOOK: 0.04,
    },
    erFollowersK: {
      INSTAGRAM: 0.03,
      FACEBOOK: 0.02,
    },
    vrK: {
      TIKTOK: 0.25,
      INSTAGRAM: 0.20,
      FACEBOOK: 0.15,
    },
    defaultFallbackK: 0.05,
  },
  stability: {
    stabMissingPolicyFloor: 0.0,
    description: 'Conservative floor = 0.0 applied to STAB when candidate has < 2 posts.',
  },
  outlierSanity: {
    erExtremeOutlierThreshold: 10.0,
    description: 'Extreme Outlier Sanity Threshold (10.0 / 1000%): Rule-based sanity guardrail to flag anomalous or corrupted engagement rates; not a deterministic proof of viral authenticity.',
  },
  dynamicWeighting: {
    defaultLambda: 0.30,
    minPoolSizeForCritic: 10,
    blendFormula: 'w_j = (1 - lambda) * b_g,j + lambda * q_j',
    fallbackMode: 'BUSINESS_FALLBACK (lambda = 0) engaged when: pool size < 10, criteria variance < EPSILON, active criteria < 2, total information C == 0, or lambda == 0',
    interpretationPolicy: 'Business Objective Weights represent predefined decision priorities across the four evidence dimensions [M1, M2, M3, M4]. They are not direct predictions of campaign-specific traffic, engagement, or conversion outcomes.',
    canonicalObjectiveWeights: {
      AWARENESS: [0.10, 0.35, 0.40, 0.15],
      ENGAGEMENT: [0.15, 0.35, 0.35, 0.15],
      TRAFFIC: [0.20, 0.35, 0.30, 0.15],
      CONVERSION: [0.40, 0.15, 0.30, 0.15],
    },
  },
  diversityReranking: {
    defaultMmrLambda: 0.70,
    mmrFormula: 'MMR(i) = lambda * rel(i) - (1 - lambda) * max_{s in S} sim(i, s)',
    intraBucketMmrStatus: 'DISABLED_IN_MVP',
  },
  futureScope: [
    'DYNAMIC_WEIGHT_OVERRIDE',
    'SIMULATION_SANDBOX',
    'OBJECTIVE_PRESET_CREATOR',
    'REALTIME_ONLINE_EXPERIMENTATION',
  ],
};
