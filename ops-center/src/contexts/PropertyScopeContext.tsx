import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Property } from '@/lib/mockData';
import { useProperties } from '@/lib/api';

export type Scope = 'portfolio' | 'property';

interface PropertyScopeContextType {
  scope: Scope;
  selectedProperty: Property | null;
  setScope: (scope: Scope) => void;
  selectProperty: (property: Property) => void;
  exitPropertyScope: () => void;
  properties: Property[];
  isLoading: boolean;
  error: Error | null;
}

const PropertyScopeContext = createContext<PropertyScopeContextType | undefined>(undefined);

export function PropertyScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<Scope>('portfolio');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Fetch properties from API
  const { data: properties = [], isLoading, error } = useProperties();

  // Log for debugging
  useEffect(() => {
    console.log('[PropertyScope] Properties loaded:', properties.length, 'isLoading:', isLoading, 'error:', error);
  }, [properties, isLoading, error]);

  // Auto-select first property if none selected and properties are loaded
  useEffect(() => {
    if (!selectedProperty && properties.length > 0) {
      // Don't auto-select, just make properties available
    }
  }, [properties, selectedProperty]);

  const selectProperty = (property: Property) => {
    setSelectedProperty(property);
    setScope('property');
  };

  const exitPropertyScope = () => {
    setScope('portfolio');
    // Keep selectedProperty for quick re-entry
  };

  return (
    <PropertyScopeContext.Provider
      value={{
        scope,
        selectedProperty,
        setScope,
        selectProperty,
        exitPropertyScope,
        properties,
        isLoading,
        error: error as Error | null,
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
