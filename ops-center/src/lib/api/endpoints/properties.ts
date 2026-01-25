// Properties API endpoints with React Query hooks

import { useQuery } from '@tanstack/react-query';
import { apiFetch, BASE_URL } from '../client';
import type { PropertiesListResponse } from '../types';
import { mapBackendProperty } from '../transformers';
import type { Property } from '../../mockData';

// ===== API Functions =====

export async function getProperties(): Promise<PropertiesListResponse> {
  console.log('[API] Fetching properties from:', BASE_URL);
  const result = await apiFetch<PropertiesListResponse>('/properties');
  console.log('[API] Properties result:', result);
  return result;
}

// ===== React Query Hooks =====

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async (): Promise<Property[]> => {
      const data = await getProperties();
      return data.properties.map(mapBackendProperty);
    },
  });
}

export function useProperty(propertyId: string | null) {
  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: async (): Promise<Property | null> => {
      if (!propertyId) return null;
      const data = await getProperties();
      const item = data.properties.find((p) => p.property_id === propertyId);
      return item ? mapBackendProperty(item) : null;
    },
    enabled: !!propertyId,
  });
}
