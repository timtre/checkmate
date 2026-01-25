// Settings API endpoints with React Query hooks

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client';

// ===== Types =====

export interface ResetPropertyDataResponse {
  reset: boolean;
}

export interface TokenCreateResponse {
  token: string;
  link: string;
}

// ===== API Functions =====

export async function resetPropertyData(
  propertyId: string
): Promise<ResetPropertyDataResponse> {
  return apiFetch(`/properties/${propertyId}/reset`, {
    method: 'DELETE',
  });
}

export async function createGuestToken(
  propertyId: string,
  guestName: string
): Promise<TokenCreateResponse> {
  return apiFetch(`/properties/${propertyId}/tokens`, {
    method: 'POST',
    body: JSON.stringify({ guest_name: guestName }),
  });
}

// ===== React Query Hooks =====

export function useResetPropertyData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId }: { propertyId: string }) =>
      resetPropertyData(propertyId),
    onSuccess: (_data, { propertyId }) => {
      // Invalidate all property-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['escalations', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['escalations', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['insights', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['suggestions', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['topQuestions', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['topQuestions', 'all'] });
    },
  });
}

export function useCreateGuestToken() {
  return useMutation({
    mutationFn: ({
      propertyId,
      guestName,
    }: {
      propertyId: string;
      guestName: string;
    }) => createGuestToken(propertyId, guestName),
  });
}
