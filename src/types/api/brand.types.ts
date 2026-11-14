export interface BrandRequest {
  userId?: string;
  businessName: string;
  industry?: string;
  productCategories?: string[];
  website?: string;
  location?: string;
  targetMarkets?: string[];
  targetAudiences?: string[];
  brandTone?: string;
  preferredPlatforms?: string[];
  description?: string;
  phoneNumber?: string | null;
  positioning?: string;
  guidelines?: string;
}

export interface BrandResponse {
  id: string;
  userId?: string;
  businessName: string;
  industry?: string;
  productCategories?: string[];
  website?: string;
  location?: string;
  targetMarkets?: string[];
  targetAudiences?: string[];
  brandTone?: string;
  preferredPlatforms?: string[];
  description?: string;
  phoneNumber?: string | null;
  positioning?: string;
  guidelines?: string;
  onboardingStatus?: 'PENDING' | 'COMPLETED';
  onboardingCompletedAt?: string;
  profileRevision?: number;
  m4Version?: number;
  embeddingStatus?: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  embeddingModel?: string;
  embeddingModelVersion?: string;
  embeddingReadyAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
