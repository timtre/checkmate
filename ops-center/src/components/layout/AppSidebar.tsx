import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { useAllEscalations } from '@/lib/api';
import { CreatePropertySheet } from '@/components/CreatePropertySheet';

interface NavItemProps {
  href: string;
  label: string;
  badge?: number;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({
  href,
  label,
  badge,
  active,
  onClick
}: NavItemProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-md text-sm transition-smooth',
        active
          ? 'text-foreground font-medium bg-accent'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      )}
    >
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-critical text-critical-foreground text-xs font-medium">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
      {children}
    </div>
  );
}

interface PropertyListItemProps {
  name: string;
  onClick: () => void;
  isSelected?: boolean;
}

function PropertyListItem({ name, onClick, isSelected }: PropertyListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-smooth',
        isSelected
          ? 'text-foreground font-medium bg-accent'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      )}
    >
      <span className="truncate">{name}</span>
      <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50" />
    </button>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedProperty,
    selectProperty,
    clearSelectedProperty,
    properties,
    isPropertyView
  } = usePropertyScope();

  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  // Fetch escalations to get urgent count
  const propertyIds = properties.map(p => p.id);
  const { data: escalations = [] } = useAllEscalations(propertyIds);

  const urgentCount = escalations.filter(
    e => e.pmActionType === 'NOTIFY_PM_URGENT' && e.status !== 'resolved' && e.status !== 'closed'
  ).length;

  // Determine active nav item - All Properties view
  const isDashboard = location.pathname === '/';
  const isEscalations = location.pathname.startsWith('/escalations') || location.pathname.startsWith('/escalation/');

  // Determine active nav item - Property view
  const isPropertyOverview = location.pathname === '/property';
  const isKnowledgeBase = location.pathname === '/property/knowledge';
  const isPropertyAnalytics = location.pathname === '/property/analytics';

  const handlePropertySelect = (property: typeof properties[0]) => {
    selectProperty(property);
    navigate('/property');
  };

  const handleBackToAllProperties = () => {
    clearSelectedProperty();
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <span className="font-semibold text-foreground">CheckMate</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {isPropertyView && selectedProperty ? (
          /* Property View Navigation */
          <>
            {/* Back button */}
            <button
              onClick={handleBackToAllProperties}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-smooth mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Properties</span>
            </button>

            {/* Property-specific nav */}
            <NavItem href="/property" label="Overview" active={isPropertyOverview} />
            <NavItem href="/property/knowledge" label="Knowledge Base" active={isKnowledgeBase} />
            <NavItem href="/property/analytics" label="Analytics" active={isPropertyAnalytics} />
          </>
        ) : (
          /* All Properties View Navigation */
          <>
            {/* Main nav items */}
            <NavItem href="/" label="Dashboard" active={isDashboard} />
            <NavItem href="/escalations" label="Escalations" badge={urgentCount} active={isEscalations} />

            {/* Divider */}
            <div className="my-3 border-t border-sidebar-border" />

            {/* Properties list */}
            <SectionLabel>Properties</SectionLabel>

            {properties.length > 0 ? (
              properties.map(property => (
                <PropertyListItem
                  key={property.id}
                  name={property.name}
                  onClick={() => handlePropertySelect(property)}
                  isSelected={selectedProperty?.id === property.id}
                />
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">No properties</p>
            )}

            {/* Add New Property Button */}
            <button
              onClick={() => setCreateSheetOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-smooth mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Property</span>
            </button>
          </>
        )}
      </nav>

      <CreatePropertySheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
      />
    </aside>
  );
}
