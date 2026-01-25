// Aggregation API endpoints with React Query hooks

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '../client';

// ===== Types =====

export interface TriggerAggregationResponse {
  status: string;
  property_id: string;
}

export interface AggregationProgress {
  phase: number;
  phase_name: string;
  status: 'progress' | 'completed' | 'error';
  percent: number;
  detail: string;
  overall_percent: number;
}

// ===== API Functions =====

export async function triggerAggregation(
  propertyId: string
): Promise<TriggerAggregationResponse> {
  const res = await fetch(`${BASE_URL}/properties/${propertyId}/insights/aggregate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status === 409) throw new Error('Aggregation already running');
  if (!res.ok) throw new Error(`Trigger aggregation failed: ${res.status}`);
  return res.json();
}

export function streamAggregationProgress(
  propertyId: string,
  onProgress: (data: AggregationProgress) => void,
  onComplete: () => void,
  onError: (error: string) => void
): () => void {
  const url = `${BASE_URL}/properties/${propertyId}/insights/aggregate/stream`;
  const eventSource = new EventSource(url);

  eventSource.addEventListener('progress', (e) => {
    try {
      const data: AggregationProgress = JSON.parse((e as MessageEvent).data);
      onProgress(data);
    } catch {
      // Ignore parse errors
    }
  });

  eventSource.addEventListener('close', () => {
    eventSource.close();
    onComplete();
  });

  eventSource.onerror = () => {
    eventSource.close();
    onError('Connection lost');
  };

  return () => eventSource.close();
}

// ===== React Query Hooks =====

export function useTriggerAggregation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId }: { propertyId: string }) =>
      triggerAggregation(propertyId),
    onSuccess: (_data, { propertyId }) => {
      // Invalidate insights-related queries after aggregation completes
      queryClient.invalidateQueries({ queryKey: ['insights', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['suggestions', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['topQuestions', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['topQuestions', 'all'] });
    },
  });
}
