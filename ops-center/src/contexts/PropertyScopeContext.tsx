import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Property } from '@/lib/mockData';
import { useProperties } from '@/lib/api';

interface PropertyScopeContextType {
  selectedProperty: Property | null;
  selectProperty: (property: Property) => void;
  clearSelectedProperty: () => void;
  properties: Property[];
  isLoading: boolean;
  error: Error | null;
  // Derived helper
  isPropertyView: boolean;
}

const PropertyScopeContext = createContext<PropertyScopeContextType | undefined>(undefined);

export function PropertyScopeProvider({ children }: { children: ReactNode }) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Fetch properties from API
  const { data: properties = [], isLoading, error } = useProperties();

  // Log for debugging
  useEffect(() => {
    console.log('[PropertyScope] Properties loaded:', properties.length, 'isLoading:', isLoading, 'error:', error);
  }, [properties, isLoading, error]);

  const selectProperty = (property: Property) => {
    setSelectedProperty(property);
  };

  const clearSelectedProperty = () => {
    setSelectedProperty(null);
  };

  // Derived state
  const isPropertyView = selectedProperty !== null;

  return (
    <PropertyScopeContext.Provider
      value={{
        selectedProperty,
        selectProperty,
        clearSelectedProperty,
        properties,
        isLoading,
        error: error as Error | null,
        isPropertyView,
      }}
    >
      {children}
    </PropertyScopeContext.Provider>
  );
}

export function usePropertyScope() {
  const context = useContext(PropertyScopeContext);
  if (context === undefined) {
    throw new Error('usePropertyScope must be used within a PropertyScopeProvider');
  }
  return context;
}
