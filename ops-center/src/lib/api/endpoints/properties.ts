// Properties API endpoints with React Query hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, BASE_URL } from '../client';
import type { PropertiesListResponse } from '../types';
import { mapBackendProperty } from '../transformers';
import type { Property } from '../../mockData';

// ===== Types =====

export interface ImageUploadResponse {
  property_id: string;
  image_url: string;
}

// ===== API Functions =====

export async function getProperties(): Promise<PropertiesListResponse> {
  console.log('[API] Fetching properties from:', BASE_URL);
  const result = await apiFetch<PropertiesListResponse>('/properties');
  console.log('[API] Properties result:', result);
  return result;
}

export async function uploadPropertyImage(
  propertyId: string,
  file: File
): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/properties/${propertyId}/image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Image upload failed: ${res.status}`);
  }

  return res.json();
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

export function useUploadPropertyImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, file }: { propertyId: string; file: File }) =>
      uploadPropertyImage(propertyId, file),
    onSuccess: () => {
      // Invalidate properties to refetch with new image URL
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
