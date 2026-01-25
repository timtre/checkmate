import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { EscalationTimeline } from '@/components/escalation/EscalationTimeline';
import { ActionPanel } from '@/components/escalation/ActionPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  escalations,
  getIntentLabel,
  getPriorityLabel,
  formatTimeAgo,
  properties,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';

const EscalationDetailPage = () => {
  const { id } = useParams();
  const escalation = escalations.find((e) => e.id === id);

  if (!escalation) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16">
          <h1 className="text-lg font-medium mb-2">Escalation not found</h1>
          <p className="text-sm text-muted-foreground mb-4">The escalation you're looking for doesn't exist.</p>
          <Link to="/escalations">
            <Button variant="outline" size="sm">Back to Escalations</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const property = properties.find(p => p.id === escalation.propertyId);
  const propertyName = property?.name || 'Unknown Property';

  const priorityStyles = {
    critical: 'text-critical',
    high: 'text-high',
    medium: 'text-medium',
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in max-w-5xl">
        {/* Breadcrumb */}
        <Link to="/escalations">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Escalations
          </Button>
        </Link>

        {/* Header - clean and minimal */}
        <div className="pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-lg font-semibold text-foreground">{escalation.summary}</h1>
            <span className={cn('text-sm font-medium', priorityStyles[escalation.priority])}>
              {getPriorityLabel(escalation.priority)}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{propertyName}</span>
            <span>·</span>
            <span>{escalation.unitName}</span>
            <span>·</span>
            <span>{escalation.guestName}</span>
            <span>·</span>
            <span>{getIntentLabel(escalation.intent)}</span>
            <span>·</span>
            <span>{formatTimeAgo(escalation.createdAt)}</span>
            {escalation.satisfactionSignal === 'unhappy' && (
              <>
                <span>·</span>
                <span className="text-critical">Guest frustrated</span>
              </>
            )}
          </div>
        </div>

        {/* Two column layout - action panel prominent */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Action panel - visually dominant, on the left */}
          <div className="lg:col-span-2 lg:order-2">
            <div className="sticky top-24">
              <ActionPanel escalation={escalation} />
            </div>
          </div>

          {/* Timeline - clean list */}
          <div className="lg:col-span-3 lg:order-1">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Timeline</h2>
            <EscalationTimeline events={escalation.timeline} />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default EscalationDetailPage;