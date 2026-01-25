import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Escalation } from '@/lib/mockData';

interface NeedsAttentionCardProps {
  escalation: Escalation;
}

// Extract the core issue as a clean tag
const extractIssueTag = (summary: string): string => {
  // Common issue patterns to extract
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

export const NeedsAttentionCard = ({ escalation }: NeedsAttentionCardProps) => {
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
};

export const EmptyAttentionState = () => (
  <div className="py-10 text-center">
    <p className="text-muted-foreground text-sm">
      All guests are taken care of 😊
    </p>
  </div>
);
