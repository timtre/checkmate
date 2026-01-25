const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
  escalate_reason: string;
}

export interface TokenValidationResponse {
  property_id: string;
  guest_name: string | null;
  conversation_id: string | null;
}

export interface MessageItem {
  message_id: string;
  role: "guest" | "assistant" | "property_manager";
  content: string;
  confidence: number | null;
  sources_json: Source[] | null;
  escalated: boolean;
  created_at: string;
}

export interface PropertyItem {
  property_id: string;
  name: string;
  conversation_count: number;
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

export async function validateToken(token: string): Promise<TokenValidationResponse> {
  const res = await fetch(`${BASE_URL}/tokens/${token}`);
  if (!res.ok) throw new Error(`Token invalid: ${res.status}`);
  return res.json();
}

export async function getMessages(
  propertyId: string,
  conversationId: string
): Promise<MessageItem[]> {
  const res = await fetch(
    `${BASE_URL}/properties/${propertyId}/conversations/${conversationId}/messages`
  );
  if (!res.ok) throw new Error(`Messages fetch failed: ${res.status}`);
  const data = await res.json();
  return data.messages;
}

export async function getProperty(propertyId: string): Promise<PropertyItem | null> {
  const res = await fetch(`${BASE_URL}/properties`);
  if (!res.ok) throw new Error(`Properties fetch failed: ${res.status}`);
  const data = await res.json();
  return data.properties.find((p: PropertyItem) => p.property_id === propertyId) || null;
}
