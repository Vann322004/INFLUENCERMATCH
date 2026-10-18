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
  m4Version?: number;
  createdAt?: string;
  updatedAt?: string;
}
