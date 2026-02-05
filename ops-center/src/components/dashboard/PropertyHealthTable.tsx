import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Property } from '@/lib/mockData';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { useAllEscalations, useAllInsights } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

type SentimentStatus = 'good' | 'at-risk' | 'needs-attention';

interface PropertyHealth {
  property: Property;
  sentiment: SentimentStatus;
  sentimentLabel: string;
  frictionRate: number;
  humanInterventionRate: number;
  autoReplyRate: number;
}

const sentimentStyles: Record<SentimentStatus, { bg: string; text: string; dot: string }> = {
  'good': {
    bg: 'bg-[hsl(var(--success-pastel))]',
    text: 'text-[hsl(var(--success-pastel-text))]',
    dot: 'bg-[hsl(var(--success))]',
  },
  'at-risk': {
    bg: 'bg-[hsl(var(--warning-pastel))]',
    text: 'text-[hsl(var(--warning-pastel-text))]',
    dot: 'bg-[hsl(var(--warning))]',
  },
  'needs-attention': {
    bg: 'bg-[hsl(var(--critical-pastel))]',
    text: 'text-[hsl(var(--critical-pastel-text))]',
    dot: 'bg-[hsl(var(--critical))]',
  },
};

const MetricChip = ({
  value,
}: {
  value: number;
}) => {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--metric-neutral))] text-[hsl(var(--metric-neutral-text))] text-sm font-medium">
      {value}%
    </span>
  );
};

const SentimentBadge = ({ status, label }: { status: SentimentStatus; label: string }) => {
  const styles = sentimentStyles[status];

  return (
    <span className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
      styles.bg,
      styles.text
    )}>
      <span className={cn('w-2 h-2 rounded-full', styles.dot)} />
      {label}
    </span>
  );
};

export const PropertyHealthTable = () => {
  const navigate = useNavigate();
  const { selectProperty, properties } = usePropertyScope();

  const propertyIds = properties.map((p) => p.id);

  // Fetch escalations from API
  const { data: escalations = [], isLoading: escalationsLoading } = useAllEscalations(propertyIds);

  // Fetch insights from API
  const { data: insights, isLoading: insightsLoading } = useAllInsights(propertyIds);

  const isLoading = escalationsLoading || insightsLoading;

  // Generate health data from API data
  const generatePropertyHealth = (): PropertyHealth[] => {
    return properties.map((property) => {
      const propertyEscalations = escalations.filter(
        (e) => e.propertyId === property.id
      );
      const criticalCount = propertyEscalations.filter(
        (e) => e.priority === 'critical' && e.status === 'open'
      ).length;
      const unhappyCount = propertyEscalations.filter(
        (e) => e.satisfactionSignal === 'unhappy' && e.status === 'open'
      ).length;
      const openCount = propertyEscalations.filter(
        (e) => e.status === 'open'
      ).length;

      let sentiment: SentimentStatus = 'good';
      let sentimentLabel = 'Good';
      if (criticalCount > 0 || unhappyCount > 1) {
        sentiment = 'needs-attention';
        sentimentLabel = 'Needs Attention';
      } else if (unhappyCount > 0 || openCount > 2) {
        sentiment = 'at-risk';
        sentimentLabel = 'At Risk';
      }

      // Calculate rates from insights (clamped to 0-100%)
      const totalConversations = insights?.total_conversations || 0;
      const totalEscalations = propertyEscalations.length;
      const humanInterventionRate = totalConversations > 0
        ? Math.max(0, Math.min(100, Math.round((totalEscalations / totalConversations) * 100)))
        : (totalEscalations > 0 ? 100 : 0);
      const autoReplyRate = Math.max(0, Math.min(100, 100 - humanInterventionRate));
      const frictionRate = humanInterventionRate;

      return {
        property,
        sentiment,
        sentimentLabel,
        frictionRate,
        humanInterventionRate,
        autoReplyRate,
      };
    });
  };

  const healthData = generatePropertyHealth().sort((a, b) => {
    // Sort by sentiment severity
    const severityOrder: Record<SentimentStatus, number> = {
      'needs-attention': 0,
      'at-risk': 1,
      'good': 2,
    };
    const sentimentDiff = severityOrder[a.sentiment] - severityOrder[b.sentiment];
    if (sentimentDiff !== 0) return sentimentDiff;
    // Then by friction rate
    return b.frictionRate - a.frictionRate;
  });

  const allHealthy = healthData.every((h) => h.sentiment === 'good');

  const handleRowClick = (property: Property) => {
    selectProperty(property);
    navigate('/property');
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Property Health — Right Now
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on live guest conversations during ongoing stays
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Property Health — Right Now
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on live guest conversations during ongoing stays
          </p>
        </div>
        <p className="text-sm text-muted-foreground py-4">No properties found</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Property Health — Right Now
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Based on live guest conversations during ongoing stays
        </p>
      </div>

      {/* Calm state message */}
      {allHealthy && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[hsl(var(--success-pastel))] text-[hsl(var(--success-pastel-text))]">
          <span>All properties are running smoothly today</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="text-xs font-medium text-muted-foreground h-10">
                Property
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-10">
                Current Sentiment
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-10 text-center">
                Friction Rate
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-10 text-center">
                Human Intervention
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-10 text-center">
                Auto Reply Rate
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthData.map((row) => (
              <TableRow
                key={row.property.id}
                onClick={() => handleRowClick(row.property)}
                className="group cursor-pointer border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <TableCell className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {row.property.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {row.property.units} units
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Review property
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <SentimentBadge status={row.sentiment} label={row.sentimentLabel} />
                </TableCell>
                <TableCell className="py-4 text-center">
                  <MetricChip value={row.frictionRate} />
                </TableCell>
                <TableCell className="py-4 text-center">
                  <MetricChip value={row.humanInterventionRate} />
                </TableCell>
                <TableCell className="py-4 text-center">
                  <MetricChip value={row.autoReplyRate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
