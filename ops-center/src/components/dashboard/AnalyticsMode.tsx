import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import {
  useTopIntents,
  useAllTopQuestions,
  useAllInsights,
  usePerPropertyInsights,
} from '@/lib/api';
import { getIntentLabel, getIntentIcon } from '@/lib/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

const dateRanges = ['7 days', '30 days', '90 days'] as const;

export const AnalyticsMode = () => {
  const [range, setRange] = useState<typeof dateRanges[number]>('30 days');
  const { properties } = usePropertyScope();
  const propertyIds = properties.map((p) => p.id);

  // Fetch data from API
  const { data: topIntents = [], isLoading: intentsLoading } = useTopIntents(propertyIds);
  const { data: topQuestions = [], isLoading: questionsLoading } = useAllTopQuestions(propertyIds);
  const { data: insights, isLoading: insightsLoading } = useAllInsights(propertyIds);
  const { data: perPropertyInsights } = usePerPropertyInsights(propertyIds);

  const isLoading = intentsLoading || questionsLoading || insightsLoading;

  // Calculate resolution stats from per-property insights for consistency
  // (useAllInsights can return stale/inconsistent data)
  const aggregateFromPerProperty = () => {
    if (!perPropertyInsights || perPropertyInsights.size === 0) {
      return { totalConversations: 0, totalEscalations: 0, conversationsWithEscalations: 0 };
    }
    let totalConversations = 0;
    let totalEscalations = 0;
    let conversationsWithEscalations = 0;
    for (const insight of perPropertyInsights.values()) {
      totalConversations += insight.totalConversations;
      totalEscalations += insight.totalEscalations;
      conversationsWithEscalations += insight.conversationsWithEscalations;
    }
    return { totalConversations, totalEscalations, conversationsWithEscalations };
  };

  const aggregated = aggregateFromPerProperty();
  const totalEscalations = aggregated.totalEscalations;
  const totalConversations = aggregated.totalConversations;
  // Use conversationsWithEscalations for accurate intervention rate (not total escalation count)
  const humanInterventionRate = totalConversations > 0
    ? Math.max(0, Math.min(100, Math.round((aggregated.conversationsWithEscalations / totalConversations) * 100)))
    : 0;
  const aiResolvedRate = totalConversations > 0
    ? Math.max(0, Math.min(100, 100 - humanInterventionRate))
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Date range selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Period:</span>
        {dateRanges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              range === r
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Experience Trends & Knowledge Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Experience Trends */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">Experience Trends</h2>
          <div className="space-y-4">
            <TrendChart label="Friction Rate" value={`${humanInterventionRate}%`} trend={humanInterventionRate <= 10 ? 'down' : 'stable'} />
            <TrendChart label="Human Intervention" value={`${humanInterventionRate}%`} trend={humanInterventionRate <= 8 ? 'down' : 'stable'} />
          </div>
        </section>

        {/* Knowledge Quality */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">Knowledge Quality</h2>
          <div className="grid grid-cols-2 gap-4">
            <KpiBox label="AI Resolution" value={`${aiResolvedRate}%`} />
            <KpiBox label="Escalations" value={String(totalEscalations)} />
          </div>
        </section>
      </div>

      {/* Top Issue Types & Resolution Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Intents */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-6">Top Issue Types</h3>
          {topIntents.length > 0 ? (
            <div className="space-y-4">
              {topIntents.slice(0, 5).map((item, index) => (
                <div key={item.intent} className="flex items-center gap-4">
                  <span className="w-6 text-center text-lg">{getIntentIcon(item.intent)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{getIntentLabel(item.intent)}</span>
                      <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: index === 0 ? 'hsl(var(--critical))' : index === 1 ? 'hsl(var(--high))' : 'hsl(var(--primary))'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No escalation data yet</p>
          )}
        </div>

        {/* Resolution stats */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-6">Resolution Performance</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-success-muted rounded-xl">
              <p className="text-4xl font-bold text-success mb-1">{aiResolvedRate}%</p>
              <p className="text-sm text-muted-foreground">Resolved by AI</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-4xl font-bold text-foreground mb-1">{humanInterventionRate}%</p>
              <p className="text-sm text-muted-foreground">Needed Human</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-4xl font-bold text-foreground mb-1">{totalConversations}</p>
              <p className="text-sm text-muted-foreground">Conversations</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-4xl font-bold text-foreground mb-1">{totalEscalations}</p>
              <p className="text-sm text-muted-foreground">Escalations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Comparison */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-4">Property Comparison</h2>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-4 px-2 pb-2 border-b border-border text-xs text-muted-foreground">
            <span className="flex-1">Property</span>
            <span className="w-24 text-center">Conversations</span>
            <span className="w-20 text-center">Friction</span>
            <span className="w-20 text-center">Human %</span>
          </div>
          <div className="space-y-1 pt-2">
            {properties.length > 0 ? (
              properties.map((property) => {
                const insight = perPropertyInsights?.get(property.id);
                return (
                  <PropertyRow
                    key={property.id}
                    name={property.name}
                    conversations={insight?.totalConversations ?? 0}
                    friction={insight?.frictionRate ?? 0}
                    intervention={insight?.interventionRate ?? 0}
                  />
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground px-2 py-4">No properties</p>
            )}
          </div>
        </div>
      </section>

      {/* Top Questions Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Top Asked Questions</h3>
        {topQuestions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead className="w-24 text-right">Asked</TableHead>
                <TableHead className="w-24 text-right">Resolved</TableHead>
                <TableHead className="w-32 text-right">Resolution Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topQuestions.map((item) => {
                const rate = item.count > 0 ? Math.round((item.resolved / item.count) * 100) : 0;
                return (
                  <TableRow key={item.question}>
                    <TableCell className="font-medium">{item.question}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.count}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.resolved}</TableCell>
                    <TableCell className="text-right">
                      <span className={rate >= 90 ? 'text-success' : rate >= 70 ? 'text-high' : 'text-critical'}>
                        {rate}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No question patterns recorded yet. Run the aggregation pipeline to generate insights.</p>
        )}
      </div>
    </div>
  );
};

const TrendChart = ({ label, value, trend }: { label: string; value: string; trend: 'up' | 'down' | 'stable' }) => (
  <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <span className="font-medium">{value}</span>
      <span className={cn(
        'text-xs',
        trend === 'up' ? 'text-success' : trend === 'down' ? 'text-success' : 'text-muted-foreground'
      )}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
      </span>
    </div>
  </div>
);

const KpiBox = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center p-3 rounded-md bg-muted/30">
    <div className="text-xl font-semibold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
  </div>
);

const PropertyRow = ({ name, conversations, friction, intervention }: { name: string; conversations: number; friction: number; intervention: number }) => (
  <div className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/20 text-sm">
    <span className="flex-1 text-foreground truncate">{name}</span>
    <span className="w-24 text-center text-muted-foreground">{conversations}</span>
    <span className={cn('w-20 text-center', friction <= 10 ? 'text-success' : 'text-warning')}>{friction}%</span>
    <span className={cn('w-20 text-center', intervention <= 8 ? 'text-success' : 'text-warning')}>{intervention}%</span>
  </div>
);
