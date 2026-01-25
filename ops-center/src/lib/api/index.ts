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
  useProperties,
  useProperty,
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
} from './endpoints/insights';
