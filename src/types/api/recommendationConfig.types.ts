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
