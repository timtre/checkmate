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
