// Backend API types - mirroring backend schemas

// ===== Properties =====

export interface PropertyItem {
  property_id: string;
  name: string;
  image_url: string;
  conversation_count: number;
}

export interface PropertiesListResponse {
  properties: PropertyItem[];
}

// ===== Escalations =====

export interface EscalationItem {
  escalation_id: string;
  conversation_id: string;
  message_id: string;
  guest_message: string;
  ai_answer: string;
  confidence: number;
  reason: string;
  status: string;
  pm_reply: string | null;
  created_at: string;
  guest_name: string;
}

export interface EscalationsListResponse {
  property_id: string;
  escalations: EscalationItem[];
}

export interface EscalationReplyResponse {
  escalation_id: string;
  status: string;
  reply_injected: boolean;
}

// ===== Messages =====

export interface Source {
  document_id: string;
  title: string;
  snippet: string;
  similarity: number;
}

export interface MessageItem {
  message_id: string;
  role: 'guest' | 'assistant' | 'property_manager';
  content: string;
  confidence: number | null;
  sources_json: Source[] | null;
  escalated: boolean;
  created_at: string;
}

export interface MessagesResponse {
  messages: MessageItem[];
}

// ===== Insights =====

export interface QuestionInsight {
  question_pattern: string;
  count: number;
  avg_confidence: number;
  escalation_count: number;
}

export interface EscalationInsight {
  reason: string;
  escalation_count: number;
  avg_confidence: number;
  sample_questions: string[];
}

export interface InsightsResponse {
  property_id: string;
  total_conversations: number;
  total_messages: number;
  total_escalations: number;
  most_asked: QuestionInsight[];
  worst_answered: QuestionInsight[];
  escalation_themes: EscalationInsight[];
}

// ===== Batch Suggestions =====

export interface BatchSuggestion {
  suggestion_id: string;
  property_id: string;
  suggestion_type: string;
  title: string;
  content: string;
  reasoning: string;
  source_patterns: string[];
  status: string;
  created_at: string | null;
}
