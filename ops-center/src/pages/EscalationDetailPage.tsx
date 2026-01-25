import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { EscalationTimeline } from '@/components/escalation/EscalationTimeline';
import { ActionPanel } from '@/components/escalation/ActionPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { useEscalationDetailFromAll } from '@/lib/api';
import {
  getIntentLabel,
  getPriorityLabel,
  formatTimeAgo,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';

const EscalationDetailPage = () => {
  const { id } = useParams();
  const { properties } = usePropertyScope();

  // Search across all properties to find the escalation
  const propertyIds = properties.map((p) => p.id);

  const { data: escalation, isLoading, error } = useEscalationDetailFromAll(propertyIds, id || null);

  // Find property name
  const property = escalation
    ? properties.find((p) => p.id === escalation.propertyId)
    : null;
  const propertyName = property?.name || 'Unknown Property';

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (error || !escalation) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16">
          <h1 className="text-lg font-medium mb-2">Escalation not found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {error ? (error as Error).message : "The escalation you're looking for doesn't exist."}
          </p>
          <Link to="/escalations">
            <Button variant="outline" size="sm">Back to Escalations</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

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

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{propertyName} / {escalation.unitName}</span>
            <span className="font-medium text-foreground">{escalation.guestName}</span>
            <span className="text-muted-foreground">{formatTimeAgo(escalation.createdAt)}</span>
            <span className="metadata-chip">{getIntentLabel(escalation.intent)}</span>
            {escalation.satisfactionSignal === 'unhappy' && (
              <span className="status-chip-critical">Guest frustrated</span>
            )}
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Timeline - clean list */}
          <div className="lg:col-span-3">
            <h2 className="section-label mb-4">Timeline</h2>
            <EscalationTimeline events={escalation.timeline} />
          </div>

          {/* Action panel - visually dominant */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <ActionPanel escalation={escalation} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default EscalationDetailPage;
