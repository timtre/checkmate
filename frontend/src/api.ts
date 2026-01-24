const BASE_URL = "http://localhost:8000";

export interface Source {
  document_id: string;
  title: string;
  snippet: string;
  similarity: number;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
  confidence: number;
  sources: Source[];
  escalated: boolean;
}

export interface DocumentIngestResponse {
  document_id: string;
  chunks_created: number;
}

export async function sendMessage(
  propertyId: string,
  message: string,
  conversationId?: string,
  guestName?: string
): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/properties/${propertyId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_id: conversationId || null,
      guest_name: guestName || null,
    }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export interface TokenValidationResponse {
  property_id: string;
  guest_name: string | null;
}

export interface TokenCreateResponse {
  token: string;
  link: string;
}

export async function validateToken(token: string): Promise<TokenValidationResponse> {
  const res = await fetch(`${BASE_URL}/tokens/${token}`);
  if (!res.ok) throw new Error(`Token invalid: ${res.status}`);
  return res.json();
}

export async function createToken(
  propertyId: string,
  guestName: string
): Promise<TokenCreateResponse> {
  const res = await fetch(`${BASE_URL}/properties/${propertyId}/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guest_name: guestName }),
  });
  if (!res.ok) throw new Error(`Token creation failed: ${res.status}`);
  return res.json();
}

export async function ingestDocument(
  propertyId: string,
  title: string,
  content: string,
  category?: string
): Promise<DocumentIngestResponse> {
  const res = await fetch(`${BASE_URL}/properties/${propertyId}/knowledge-base`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, category: category || null, metadata: {} }),
  });
  if (!res.ok) throw new Error(`Ingest failed: ${res.status}`);
  return res.json();
}

// ===== Knowledge Base Documents =====

export interface KnowledgeBaseDocument {
  document_id: string;
  title: string;
  category: string;
  content: string;
  chunk_count: number;
}

export interface KnowledgeBaseDocumentsResponse {
  property_id: string;
  documents: KnowledgeBaseDocument[];
}

export async function getDocuments(
  propertyId: string
): Promise<KnowledgeBaseDocumentsResponse> {
  const res = await fetch(`${BASE_URL}/properties/${propertyId}/knowledge-base`);
  if (!res.ok) throw new Error(`Documents fetch failed: ${res.status}`);
  return res.json();
}

// ===== Properties =====

export interface PropertyItem {
  property_id: string;
  name: string;
  conversation_count: number;
}

export interface PropertiesListResponse {
  properties: PropertyItem[];
}

export async function getProperties(): Promise<PropertiesListResponse> {
  const res = await fetch(`${BASE_URL}/properties`);
  if (!res.ok) throw new Error(`Properties failed: ${res.status}`);
  return res.json();
}

export interface PropertyResponse {
  property_id: string;
  name: string;
}

export async function createProperty(
  propertyId: string,
  name: string
): Promise<PropertyResponse> {
  const res = await fetch(`${BASE_URL}/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ property_id: propertyId, name }),
  });
  if (!res.ok) throw new Error(`Create property failed: ${res.status}`);
  return res.json();
}

export async function updatePropertyName(
  propertyId: string,
  name: string
): Promise<PropertyResponse> {
  const res = await fetch(`${BASE_URL}/properties/${propertyId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Update property failed: ${res.status}`);
  return res.json();
}

// ===== PM Dashboard Types =====

export interface QuestionInsight {
  question_pattern: string;
  count: number;
  avg_confidence: number;
  escalation_count: number;
}

export interface InsightsResponse {
  property_id: string;
  total_conversations: number;
  total_messages: number;
  total_escalations: number;
  most_asked: QuestionInsight[];
  worst_answered: QuestionInsight[];
}

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

// ===== PM Dashboard Functions =====

export async function getInsights(propertyId: string): Promise<InsightsResponse> {
  const res = await fetch(`${BASE_URL}/properties/${propertyId}/insights`);
  if (!res.ok) throw new Error(`Insights failed: ${res.status}`);
  return res.json();
}

export async function getEscalations(
  propertyId: string,
  status?: string
): Promise<EscalationsListResponse> {
  const params = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE_URL}/properties/${propertyId}/escalations${params}`);
  if (!res.ok) throw new Error(`Escalations failed: ${res.status}`);
  return res.json();
}

export async function replyToEscalation(
  escalationId: string,
  replyText: string,
  repliedBy?: string
): Promise<EscalationReplyResponse> {
  const res = await fetch(`${BASE_URL}/escalations/${escalationId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reply_text: replyText,
      replied_by: repliedBy || "property_manager",
    }),
  });
  if (!res.ok) throw new Error(`Reply failed: ${res.status}`);
  return res.json();
}
