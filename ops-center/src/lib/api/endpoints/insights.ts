// Insights API endpoints with React Query hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { InsightsResponse, BatchSuggestion, EscalationsListResponse } from '../types';
import {
  mapBatchSuggestion,
  mapInsightsToTopIntents,
  mapInsightsToTopQuestions,
  type TopIntentItem,
  type TopQuestionItem,
} from '../transformers';
import type { DocSuggestion } from '../../mockData';

// ===== API Functions =====

export async function getInsights(propertyId: string): Promise<InsightsResponse> {
  return apiFetch(`/properties/${propertyId}/insights`);
}

export async function getBatchSuggestions(propertyId: string): Promise<BatchSuggestion[]> {
  return apiFetch(`/properties/${propertyId}/batch-suggestions`);
}

export async function updateBatchSuggestion(
  propertyId: string,
  suggestionId: string,
  status: string
): Promise<void> {
  await apiFetch(`/properties/${propertyId}/batch-suggestions/${suggestionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ===== React Query Hooks =====

export function useInsights(propertyId: string | null) {
  return useQuery({
    queryKey: ['insights', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      return getInsights(propertyId);
    },
    enabled: !!propertyId,
  });
}

export function useAllInsights(propertyIds: string[]) {
  return useQuery({
    queryKey: ['insights', 'all', propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return null;

      const results = await Promise.all(
        propertyIds.map((id) => getInsights(id).catch(() => null))
      );

      // Aggregate insights across properties
      const aggregated: InsightsResponse = {
        property_id: 'all',
        total_conversations: 0,
        total_messages: 0,
        total_escalations: 0,
        most_asked: [],
        worst_answered: [],
        escalation_themes: [],
      };

      for (const result of results) {
        if (result) {
          aggregated.total_conversations += result.total_conversations;
          aggregated.total_messages += result.total_messages;
          aggregated.total_escalations += result.total_escalations;
          aggregated.most_asked.push(...result.most_asked);
          aggregated.worst_answered.push(...result.worst_answered);
          aggregated.escalation_themes.push(...result.escalation_themes);
        }
      }

      return aggregated;
    },
    enabled: propertyIds.length > 0,
  });
}

export function useBatchSuggestions(propertyId: string | null) {
  return useQuery({
    queryKey: ['batch-suggestions', propertyId],
    queryFn: async (): Promise<DocSuggestion[]> => {
      if (!propertyId) return [];
      const data = await getBatchSuggestions(propertyId);
      return data.map(mapBatchSuggestion);
    },
    enabled: !!propertyId,
  });
}

export function useAllBatchSuggestions(propertyIds: string[]) {
  return useQuery({
    queryKey: ['batch-suggestions', 'all', propertyIds],
    queryFn: async (): Promise<DocSuggestion[]> => {
      if (propertyIds.length === 0) return [];

      const results = await Promise.all(
        propertyIds.map((id) => getBatchSuggestions(id).catch(() => []))
      );

      return results.flat().map(mapBatchSuggestion);
    },
    enabled: propertyIds.length > 0,
  });
}

export function useUpdateBatchSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      suggestionId,
      status,
    }: {
      propertyId: string;
      suggestionId: string;
      status: string;
    }) => updateBatchSuggestion(propertyId, suggestionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-suggestions'] });
    },
  });
}

// ===== Analytics Hooks =====

export function useTopIntents(propertyIds: string[]) {
  return useQuery({
    queryKey: ['top-intents', propertyIds],
    queryFn: async (): Promise<TopIntentItem[]> => {
      if (propertyIds.length === 0) return [];

      // Fetch escalations to derive intents
      const results = await Promise.all(
        propertyIds.map((id) =>
          apiFetch<EscalationsListResponse>(`/properties/${id}/escalations`).catch(() => ({
            property_id: id,
            escalations: [],
          }))
        )
      );

      const allEscalations = results.flatMap((r) => r.escalations);
      return mapInsightsToTopIntents(allEscalations);
    },
    enabled: propertyIds.length > 0,
  });
}

export function useTopQuestions(propertyId: string | null) {
  return useQuery({
    queryKey: ['top-questions', propertyId],
    queryFn: async (): Promise<TopQuestionItem[]> => {
      if (!propertyId) return [];
      const data = await getInsights(propertyId);
      return mapInsightsToTopQuestions(data.most_asked);
    },
    enabled: !!propertyId,
  });
}

export function useAllTopQuestions(propertyIds: string[]) {
  return useQuery({
    queryKey: ['top-questions', 'all', propertyIds],
    queryFn: async (): Promise<TopQuestionItem[]> => {
      if (propertyIds.length === 0) return [];

      const results = await Promise.all(
        propertyIds.map((id) => getInsights(id).catch(() => null))
      );

      // Aggregate most_asked across properties
      const allMostAsked = results
        .filter((r): r is InsightsResponse => r !== null)
        .flatMap((r) => r.most_asked);

      // Group by question pattern and sum counts
      const grouped = new Map<string, { count: number; escalation_count: number }>();
      for (const q of allMostAsked) {
        const existing = grouped.get(q.question_pattern);
        if (existing) {
          existing.count += q.count;
          existing.escalation_count += q.escalation_count;
        } else {
          grouped.set(q.question_pattern, {
            count: q.count,
            escalation_count: q.escalation_count,
          });
        }
      }

      return Array.from(grouped.entries())
        .map(([question, { count, escalation_count }]) => ({
          question,
          count,
          resolved: count - escalation_count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    enabled: propertyIds.length > 0,
  });
}
