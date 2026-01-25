import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Unlock, RefreshCw, ChevronRight } from 'lucide-react';
import { Escalation, getIntentLabel, getPriorityLabel, formatTimeAgo } from '@/lib/mockData';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
interface EscalationCardProps {
  escalation: Escalation;
  compact?: boolean;
}
export function EscalationCard({
  escalation,
  compact = false
}: EscalationCardProps) {
  const navigate = useNavigate();
  const {
    selectProperty,
    properties
  } = usePropertyScope();
  const borderStyles = {
    critical: 'escalation-critical',
    high: 'escalation-high',
    medium: 'escalation-medium'
  };
  const isUrgent = escalation.priority === 'critical';
  const needsInput = escalation.pmActionType === 'REQUEST_PM_INPUT';

  // Get property name
  const property = properties.find(p => p.id === escalation.propertyId);
  const propertyName = property?.name || 'Unknown Property';
  const handleViewProperty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (property) {
      selectProperty(property);
      navigate('/property');
    }
  };

  // Get primary action based on intent
  const getPrimaryAction = () => {
    switch (escalation.intent) {
      case 'access_issue':
        return {
          label: 'Call Guest',
          icon: Phone
        };
      case 'wifi_issue':
        return {
          label: 'Send Hotspot Info',
          icon: MessageSquare
        };
      case 'arrival_navigation':
        return {
          label: 'Clarify Entrance',
          icon: MessageSquare
        };
      default:
        return {
          label: 'Message Guest',
          icon: MessageSquare
        };
    }
  };
  const primaryAction = getPrimaryAction();
  const PrimaryIcon = primaryAction.icon;
  return <div className={cn("py-4 border-b border-border last:border-b-0 transition-smooth pl-4 rounded-none shadow-xl", borderStyles[escalation.priority])}>
      {/* Header row: Title + Property */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <Link to={`/escalation/${escalation.id}`} className="group">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
              {escalation.summary}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {propertyName} · {escalation.unitName}
          </p>
        </div>
        
        {isUrgent && <span className="badge-critical px-2 py-0.5 rounded flex-shrink-0">
            {getPriorityLabel(escalation.priority)}
          </span>}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
        <span>{escalation.guestName}</span>
        <span>·</span>
        <span>{formatTimeAgo(escalation.createdAt)}</span>
        <span>·</span>
        <span>{getIntentLabel(escalation.intent)}</span>
        {needsInput && <>
            <span>·</span>
            <span className="text-high font-medium">Needs input</span>
          </>}
      </div>

      {/* Agent status - subtle */}
      {escalation.satisfactionSignal === 'unhappy' && <p className="text-xs text-critical mb-3">Guest appears frustrated</p>}

      {/* Actions row */}
      {!compact && <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1.5">
            <PrimaryIcon className="w-3.5 h-3.5" />
            {primaryAction.label}
          </Button>
          
          {escalation.intent === 'access_issue' && <>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground">
                <Unlock className="w-3.5 h-3.5" />
                Unlock
              </Button>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5" />
                New Code
              </Button>
            </>}
          
          <button onClick={handleViewProperty} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            View property
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>}
    </div>;
}