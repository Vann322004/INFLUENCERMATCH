// Common API Response Types based on OpenAPI specification

export interface ResponseMeta {
  timestamp?: string;
  traceId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ResponseMeta;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// RFC 7807 Problem Details
export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
  timestamp?: string;
  errors?: Record<string, string[]>;
}
