// API module - re-export all hooks and types

// Client
export { apiFetch, ApiError, BASE_URL } from './client';

// Types
export type {
  PropertyItem,
  PropertiesListResponse,
  EscalationItem,
  EscalationsListResponse,
  EscalationReplyResponse,
  MessageItem,
  MessagesResponse,
  Source,
  InsightsResponse,
  QuestionInsight,
  EscalationInsight,
  BatchSuggestion,
} from './types';

// Transformers
export {
  derivePriority,
  derivePmActionType,
  deriveIntent,
  deriveSatisfactionSignal,
  mapStatus,
  deriveRecommendedActions,
  mapBackendEscalation,
  buildTimeline,
  mapBackendProperty,
  mapBatchSuggestion,
  mapInsightsToTopIntents,
  mapInsightsToTopQuestions,
  type TopIntentItem,
  type TopQuestionItem,
} from './transformers';

// Endpoint hooks
export {
  getEscalations,
  getAllEscalations,
  replyToEscalation,
  getMessages,
  useEscalations,
  useAllEscalations,
  useEscalationDetail,
  useEscalationDetailFromAll,
  useConversationTimeline,
  useReplyToEscalation,
} from './endpoints/escalations';

export {
  getProperties,
  uploadPropertyImage,
  useProperties,
  useProperty,
  useUploadPropertyImage,
  type ImageUploadResponse,
} from './endpoints/properties';

export {
  getInsights,
  getBatchSuggestions,
  updateBatchSuggestion,
  useInsights,
  useAllInsights,
  useBatchSuggestions,
  useAllBatchSuggestions,
  useUpdateBatchSuggestion,
  useTopIntents,
  useTopQuestions,
  useAllTopQuestions,
  usePerPropertyInsights,
  type PerPropertyInsight,
} from './endpoints/insights';

export {
  getKnowledgeBase,
  ingestDocument,
  useKnowledgeBase,
  usePropertyDocument,
  useIngestDocument,
  type KnowledgeBaseDocument,
  type KnowledgeBaseResponse,
  type IngestDocumentRequest,
  type IngestDocumentResponse,
} from './endpoints/knowledge-base';

export {
  resetPropertyData,
  createGuestToken,
  useResetPropertyData,
  useCreateGuestToken,
  type ResetPropertyDataResponse,
  type TokenCreateResponse,
} from './endpoints/settings';

export {
  triggerAggregation,
  streamAggregationProgress,
  useTriggerAggregation,
  type TriggerAggregationResponse,
  type AggregationProgress,
} from './endpoints/aggregation';
