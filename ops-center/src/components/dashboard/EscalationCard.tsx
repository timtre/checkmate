import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Unlock, RefreshCw, ChevronRight } from 'lucide-react';
import { Escalation, getIntentLabel, getPriorityLabel, formatTimeAgo } from '@/lib/mockData';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';

type EscalationVariant = 'compact' | 'full' | 'closed';

interface EscalationCardProps {
  escalation: Escalation;
  variant?: EscalationVariant;
}

// Extract the core issue as a clean tag
const extractIssueTag = (summary: string): string => {
  const issuePatterns: Record<string, string> = {
    'door code': 'Door Code Issue',
    'locked out': 'Locked Out',
    'not working': summary.split('not working')[0].trim() + ' Not Working',
    'broken': summary.split('broken')[0].trim() + ' Broken',
    'wi-fi': 'Wi-Fi Issue',
    'wifi': 'Wi-Fi Issue',
    'no heat': 'No Heating',
    'heating': 'Heating Issue',
    'no hot water': 'No Hot Water',
    'no water': 'No Water',
    'no power': 'No Power',
    'leak': 'Water Leak',
    'noise': 'Noise Complaint',
    'smell': 'Odor Issue',
    'stuck': 'Access Blocked',
  };

  const lowerSummary = summary.toLowerCase();
  for (const [pattern, tag] of Object.entries(issuePatterns)) {
    if (lowerSummary.includes(pattern)) {
      return tag;
    }
  }

  // Fallback: use first few words capitalized
  return summary.split(' ').slice(0, 3).join(' ');
};

const getSentimentStyles = (priority: string, satisfaction: string) => {
  if (satisfaction === 'unhappy' || priority === 'critical') {
    return {
      dot: 'bg-[hsl(var(--critical))]',
      bg: 'bg-[hsl(var(--critical-pastel))]',
    };
  }
  if (priority === 'high') {
    return {
      dot: 'bg-[hsl(var(--warning))]',
      bg: 'bg-[hsl(var(--warning-pastel))]',
    };
  }
  return {
    dot: 'bg-[hsl(var(--success))]',
    bg: 'bg-[hsl(var(--success-pastel))]',
  };
};

export function EscalationCard({
  escalation,
  variant = 'full'
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

  // Compact variant - dashboard preview style
  if (variant === 'compact') {
    const waitingTime = formatDistanceToNow(new Date(escalation.createdAt), { addSuffix: false });
    const issueTag = extractIssueTag(escalation.summary);
    const styles = getSentimentStyles(escalation.priority, escalation.satisfactionSignal);

    return (
      <div className="flex items-center justify-between py-4 border-b border-border/30 last:border-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Pastel sentiment dot */}
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full shrink-0',
              styles.dot
            )}
            aria-label="sentiment indicator"
          />

          <div className="min-w-0 flex-1">
            {/* Issue tag - primary visual element */}
            <span className={cn(
              'inline-block px-2.5 py-1 rounded-md text-sm font-semibold text-foreground',
              styles.bg
            )}>
              {issueTag}
            </span>

            {/* Secondary info - property and timing */}
            <p className="text-xs text-muted-foreground mt-1.5">
              {escalation.unitName} · {waitingTime} waiting
            </p>
          </div>
        </div>

        <Link to={`/escalation/${escalation.id}`}>
          <Button size="sm" className="shrink-0 ml-4">
            Jump in
          </Button>
        </Link>
      </div>
    );
  }

  // Closed variant - minimal display for resolved items
  if (variant === 'closed') {
    return (
      <div className={cn("py-4 border-b border-border last:border-b-0 transition-smooth pl-4 rounded-none opacity-60", borderStyles[escalation.priority])}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <Link to={`/escalation/${escalation.id}`} className="group">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
                {escalation.summary}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {propertyName} / {escalation.unitName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{escalation.guestName}</span>
          <span className="text-muted-foreground">{formatTimeAgo(escalation.createdAt)}</span>
          <span className="metadata-chip">{getIntentLabel(escalation.intent)}</span>
        </div>
      </div>
    );
  }

  // Full variant - inbox open tab style with actions
  return (
    <div className={cn("py-4 border-b border-border last:border-b-0 transition-smooth pl-4 rounded-none", borderStyles[escalation.priority])}>
      {/* Header row: Title + Property */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <Link to={`/escalation/${escalation.id}`} className="group">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
              {escalation.summary}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {propertyName} / {escalation.unitName}
          </p>
        </div>

        {isUrgent && (
          <span className="badge-critical px-2 py-0.5 rounded flex-shrink-0">
            {getPriorityLabel(escalation.priority)}
          </span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
        <span className="font-medium text-foreground">{escalation.guestName}</span>
        <span className="text-muted-foreground">{formatTimeAgo(escalation.createdAt)}</span>
        <span className="metadata-chip">{getIntentLabel(escalation.intent)}</span>
        {needsInput && <span className="status-chip-warning">Needs input</span>}
      </div>

      {/* Agent status - subtle */}
      {escalation.satisfactionSignal === 'unhappy' && (
        <p className="text-xs text-critical mb-3">Guest appears frustrated</p>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-8 gap-1.5">
          <PrimaryIcon className="w-3.5 h-3.5" />
          {primaryAction.label}
        </Button>

        {escalation.intent === 'access_issue' && (
          <>
            <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground">
              <Unlock className="w-3.5 h-3.5" />
              Unlock
            </Button>
            <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
              New Code
            </Button>
          </>
        )}

        <button
          onClick={handleViewProperty}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View property
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export const EmptyAttentionState = () => (
  <div className="py-10 text-center">
    <p className="text-muted-foreground text-sm">
      All guests are taken care of
    </p>
  </div>
);
