import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { escalations } from '@/lib/mockData';
interface NavItemProps {
  href: string;
  label: string;
  badge?: number;
  active?: boolean;
  onClick?: () => void;
  indent?: boolean;
}
function NavItem({
  href,
  label,
  badge,
  active,
  onClick,
  indent
}: NavItemProps) {
  return <Link to={href} onClick={onClick} className={cn('flex items-center justify-between px-3 py-2 rounded-md text-sm transition-smooth', indent && 'ml-3', active ? 'text-foreground font-medium bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-critical text-critical-foreground text-xs font-medium">
          {badge}
        </span>}
    </Link>;
}
function SectionLabel({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
      {children}
    </div>;
}
export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    scope,
    selectedProperty,
    selectProperty,
    exitPropertyScope,
    properties
  } = usePropertyScope();
  const [isPropertyOpen, setIsPropertyOpen] = React.useState(false);
  const urgentCount = escalations.filter(e => e.pmActionType === 'NOTIFY_PM_URGENT' && e.status !== 'resolved' && e.status !== 'closed').length;
  const isPropertyScope = scope === 'property';

  // Determine active nav item
  const isPortfolioDashboard = location.pathname === '/';
  const isEscalations = location.pathname.startsWith('/escalations') || location.pathname.startsWith('/escalation/');
  const isPortfolioAnalytics = location.pathname === '/analytics';
  const isPropertyOverview = location.pathname === '/property';
  const isKnowledgeBase = location.pathname === '/property/knowledge';
  const isPropertyAnalytics = location.pathname === '/property/analytics';
  const handlePropertySelect = (property: typeof properties[0]) => {
    selectProperty(property);
    setIsPropertyOpen(false);
    navigate('/property');
  };
  const handleExitPropertyScope = () => {
    exitPropertyScope();
    navigate('/');
  };
  return <aside className="fixed left-0 top-0 h-screen w-56 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <span className="font-semibold text-foreground">StayMate</span>
      </div>

      {/* Scope Indicator */}
      {isPropertyScope && selectedProperty && <div className="px-3 py-3 border-b border-sidebar-border">
          <button onClick={handleExitPropertyScope} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-smooth">
            ← Portfolio
          </button>
          <p className="text-sm font-medium text-foreground truncate">
            {selectedProperty.name}
          </p>
        </div>}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Portfolio Section */}
        <SectionLabel>Portfolio</SectionLabel>
        
        <NavItem href="/" label="Dashboard" active={isPortfolioDashboard} />
        <NavItem href="/escalations" label="Escalations" badge={urgentCount} active={isEscalations} />
        <NavItem href="/analytics" label="Analytics" active={isPortfolioAnalytics} />

        {/* Divider */}
        <div className="my-3 border-t border-sidebar-border" />

        {/* Properties Section */}
        <SectionLabel>Properties</SectionLabel>

        {/* Property Selector */}
        <button onClick={() => setIsPropertyOpen(!isPropertyOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-smooth">
          <span className="truncate">
            {selectedProperty?.name || 'Select property'}
          </span>
          {isPropertyOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
        </button>

        {isPropertyOpen && <div className="mt-1 py-1 rounded-md bg-accent/50 animate-fade-in">
            {properties.map(property => <button key={property.id} onClick={() => handlePropertySelect(property)} className={cn('w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-smooth', selectedProperty?.id === property.id ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {property.name}
              </button>)}
          </div>}

        {/* Property scope navigation */}
        {isPropertyScope && selectedProperty && <div className="mt-1 space-y-0.5">
            <NavItem href="/property" label="Overview" active={isPropertyOverview} indent />
            <NavItem href="/property/knowledge" label="Knowledge Base" active={isKnowledgeBase} indent />
            <NavItem href="/property/analytics" label="Analytics" active={isPropertyAnalytics} indent />
          </div>}
      </nav>
    </aside>;
}