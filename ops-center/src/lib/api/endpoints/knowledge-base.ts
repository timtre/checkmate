// Knowledge Base API endpoints with React Query hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client';

// ===== Types =====

export interface KnowledgeBaseDocument {
  document_id: string;
  title: string;
  category: string;
  content: string;
  chunk_count: number;
}

export interface KnowledgeBaseResponse {
  property_id: string;
  documents: KnowledgeBaseDocument[];
}

export interface IngestDocumentRequest {
  title: string;
  content: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestDocumentResponse {
  document_id: string;
  chunks_created: number;
}

// ===== API Functions =====

export async function getKnowledgeBase(propertyId: string): Promise<KnowledgeBaseResponse> {
  return apiFetch<KnowledgeBaseResponse>(`/properties/${propertyId}/knowledge-base`);
}

export async function ingestDocument(
  propertyId: string,
  request: IngestDocumentRequest
): Promise<IngestDocumentResponse> {
  return apiFetch<IngestDocumentResponse>(`/properties/${propertyId}/knowledge-base`, {
    method: 'POST',
    body: JSON.stringify({
      title: request.title,
      content: request.content,
      category: request.category || null,
      metadata: request.metadata || {},
    }),
  });
}

// ===== React Query Hooks =====

export function useKnowledgeBase(propertyId: string | null) {
  return useQuery({
    queryKey: ['knowledge-base', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      return getKnowledgeBase(propertyId);
    },
    enabled: !!propertyId,
  });
}

export function usePropertyDocument(propertyId: string | null) {
  return useQuery({
    queryKey: ['property-document', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const response = await getKnowledgeBase(propertyId);
      if (response.documents.length === 0) return null;
      return {
        title: response.documents[0].title,
        content: response.documents[0].content,
      };
    },
    enabled: !!propertyId,
  });
}

export function useIngestDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      title,
      content,
      category,
    }: {
      propertyId: string;
      title: string;
      content: string;
      category?: string;
    }) => {
      return ingestDocument(propertyId, { title, content, category });
    },
    onSuccess: (_, variables) => {
      // Invalidate the knowledge base cache for this property
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-document', variables.propertyId] });
    },
  });
}
