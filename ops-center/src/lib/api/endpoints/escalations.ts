// Escalations API endpoints with React Query hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type {
  EscalationsListResponse,
  EscalationReplyResponse,
  MessageItem,
} from '../types';
import {
  mapBackendEscalation,
  buildTimeline,
} from '../transformers';
import type { Escalation, TimelineEvent } from '../../mockData';

// ===== API Functions =====

export async function getEscalations(
  propertyId: string,
  status?: string,
  guestName?: string
): Promise<EscalationsListResponse> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (guestName) params.set('guest_name', guestName);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/properties/${propertyId}/escalations${qs}`);
}

export async function getAllEscalations(
  propertyIds: string[],
  status?: string
): Promise<{ propertyId: string; escalations: EscalationsListResponse['escalations'] }[]> {
  const results = await Promise.all(
    propertyIds.map(async (propertyId) => {
      const data = await getEscalations(propertyId, status);
      return { propertyId, escalations: data.escalations };
    })
  );
  return results;
}

export async function replyToEscalation(
  escalationId: string,
  replyText: string,
  repliedBy?: string
): Promise<EscalationReplyResponse> {
  return apiFetch(`/escalations/${escalationId}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      reply_text: replyText,
      replied_by: repliedBy || 'property_manager',
    }),
  });
}

export async function getMessages(
  propertyId: string,
  conversationId: string
): Promise<MessageItem[]> {
  const data = await apiFetch<{ messages: MessageItem[] }>(
    `/properties/${propertyId}/conversations/${conversationId}/messages`
  );
  return data.messages;
}

// ===== React Query Hooks =====

export function useEscalations(
  propertyId: string | null,
  status?: string,
  guestName?: string
) {
  return useQuery({
    queryKey: ['escalations', propertyId, status, guestName],
    queryFn: async () => {
      if (!propertyId) return [];
      const data = await getEscalations(propertyId, status, guestName);
      return data.escalations.map((item) =>
        mapBackendEscalation(item, propertyId)
      );
    },
    enabled: !!propertyId,
  });
}

export function useAllEscalations(
  propertyIds: string[],
  status?: string
) {
  return useQuery({
    queryKey: ['escalations', 'all', propertyIds, status],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const results = await getAllEscalations(propertyIds, status);
      const escalations: Escalation[] = [];
      for (const { propertyId, escalations: items } of results) {
        for (const item of items) {
          escalations.push(mapBackendEscalation(item, propertyId));
        }
      }
      return escalations;
    },
    enabled: propertyIds.length > 0,
  });
}

export function useEscalationDetail(
  propertyId: string | null,
  escalationId: string | null
) {
  return useQuery({
    queryKey: ['escalation', propertyId, escalationId],
    queryFn: async () => {
      if (!propertyId || !escalationId) return null;

      // Fetch escalation from list (backend doesn't have single-item endpoint)
      const data = await getEscalations(propertyId);
      const item = data.escalations.find((e) => e.escalation_id === escalationId);

      if (!item) return null;

      // Fetch full conversation messages for timeline
      let messages: MessageItem[] = [];
      try {
        messages = await getMessages(propertyId, item.conversation_id);
      } catch {
        // Fall back to minimal timeline if messages fetch fails
      }

      return mapBackendEscalation(item, propertyId, messages);
    },
    enabled: !!propertyId && !!escalationId,
  });
}

export function useEscalationDetailFromAll(
  propertyIds: string[],
  escalationId: string | null
) {
  return useQuery({
    queryKey: ['escalation', 'all', propertyIds, escalationId],
    queryFn: async () => {
      if (propertyIds.length === 0 || !escalationId) return null;

      // Search across all properties for the escalation
      for (const propertyId of propertyIds) {
        try {
          const data = await getEscalations(propertyId);
          const item = data.escalations.find((e) => e.escalation_id === escalationId);

          if (item) {
            // Found it! Fetch messages for timeline
            let messages: MessageItem[] = [];
            try {
              messages = await getMessages(propertyId, item.conversation_id);
            } catch {
              // Fall back to minimal timeline
            }
            return mapBackendEscalation(item, propertyId, messages);
          }
        } catch {
          // Continue searching other properties
        }
      }

      return null;
    },
    enabled: propertyIds.length > 0 && !!escalationId,
  });
}

export function useConversationTimeline(
  propertyId: string | null,
  conversationId: string | null
) {
  return useQuery({
    queryKey: ['messages', propertyId, conversationId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!propertyId || !conversationId) return [];
      const messages = await getMessages(propertyId, conversationId);
      return buildTimeline(messages);
    },
    enabled: !!propertyId && !!conversationId,
  });
}

export function useReplyToEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      escalationId,
      replyText,
      repliedBy,
    }: {
      escalationId: string;
      replyText: string;
      repliedBy?: string;
    }) => replyToEscalation(escalationId, replyText, repliedBy),
    onSuccess: () => {
      // Invalidate escalation queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: ['escalation'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
