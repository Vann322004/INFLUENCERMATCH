// =============================================
// COLLABORATION SERVICE - InfluencerMatch
// Maps to: POST /campaigns/{campaignId}/collaborations
//          POST /collaborations/{collaborationId}/outcome
//          POST /collaborations/{collaborationId}/review
// =============================================

import apiClient from '../apiClient';
import type {
  CreateCollaborationRequest,
  CollaborationResponse,
  RecordOutcomeRequest,
  OutcomeResponse,
  CreateCreatorReviewRequest,
  CreatorReviewResponse,
} from '../../types/api/collaboration.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** POST /campaigns/{campaignId}/collaborations — confirm a creator collaboration */
const createCollaboration = async (
  campaignId: string,
  payload: CreateCollaborationRequest
): Promise<CollaborationResponse> => {
  const response = await apiClient.post<ApiResponse<CollaborationResponse>>(
    `/campaigns/${campaignId}/collaborations`,
    payload
  );
  return response.data.data;
};

/** POST /collaborations/{collaborationId}/outcome — record a collaboration outcome (views, clicks, post URL) */
const recordOutcome = async (
  collaborationId: string,
  payload: RecordOutcomeRequest
): Promise<OutcomeResponse> => {
  const response = await apiClient.post<ApiResponse<OutcomeResponse>>(
    `/collaborations/${collaborationId}/outcome`,
    payload
  );
  return response.data.data;
};

/** POST /collaborations/{collaborationId}/review — review a completed collaboration */
const reviewCreator = async (
  collaborationId: string,
  payload: CreateCreatorReviewRequest
): Promise<CreatorReviewResponse> => {
  const response = await apiClient.post<ApiResponse<CreatorReviewResponse>>(
    `/collaborations/${collaborationId}/review`,
    payload
  );
  return response.data.data;
};

export const collaborationService = {
  createCollaboration,
  recordOutcome,
  reviewCreator,
};
