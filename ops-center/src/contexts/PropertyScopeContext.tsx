import { createContext, useContext, useState, ReactNode } from 'react';
import { Property, properties } from '@/lib/mockData';

export type Scope = 'portfolio' | 'property';

interface PropertyScopeContextType {
  scope: Scope;
  selectedProperty: Property | null;
  setScope: (scope: Scope) => void;
  selectProperty: (property: Property) => void;
  exitPropertyScope: () => void;
  properties: Property[];
}

const PropertyScopeContext = createContext<PropertyScopeContextType | undefined>(undefined);

export function PropertyScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<Scope>('portfolio');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

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

