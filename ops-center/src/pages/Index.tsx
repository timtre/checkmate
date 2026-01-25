import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ModeToggle } from '@/components/dashboard/ModeToggle';
import { EscalationCard, EmptyAttentionState } from '@/components/dashboard/EscalationCard';
import { PropertyHealthTable } from '@/components/dashboard/PropertyHealthTable';
import { AnalyticsMode } from '@/components/dashboard/AnalyticsMode';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { useAllEscalations } from '@/lib/api';
import { Loader2, ChevronRight } from 'lucide-react';

const MAX_DASHBOARD_ITEMS = 3;

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const Index = () => {
  const [mode, setMode] = useState<'ops' | 'analytics'>('ops');
  const { properties } = usePropertyScope();

  const propertyIds = properties.map((p) => p.id);

  // Fetch escalations from API
  const { data: escalations = [], isLoading } = useAllEscalations(propertyIds);

  const needsAttention = escalations
    .filter((e) => e.status === 'open')
    .sort((a, b) => {
      // Sort by priority first (critical > high > medium > low)
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      if (priorityDiff !== 0) return priorityDiff;
      // Then by time (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const displayItems = needsAttention.slice(0, MAX_DASHBOARD_ITEMS);
  const overflowCount = needsAttention.length - MAX_DASHBOARD_ITEMS;

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in max-w-6xl">
        {/* Header with mode toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {mode === 'ops' ? getGreeting() : 'Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'ops'
                ? isLoading
                  ? 'Loading...'
                  : `${needsAttention.length} items need your attention`
                : 'Review trends and improve operations'
              }
            </p>
          </div>
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>

        {mode === 'ops' ? (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Needs Attention - Top section */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                      {needsAttention.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-warning" />
                      )}
                      Needs attention now
                    </h2>
                    {needsAttention.length > 0 && (
                      <Link
                        to="/escalations"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        View all
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card px-4">
                    {displayItems.length > 0 ? (
                      <>
                        {displayItems.map((escalation) => (
                          <EscalationCard
                            key={escalation.id}
                            escalation={escalation}
                            variant="compact"
                          />
                        ))}
                        {overflowCount > 0 && (
                          <Link
                            to="/escalations"
                            className="block py-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors border-t border-border/30"
                          >
                            + {overflowCount} more in escalations
                          </Link>
                        )}
                      </>
                    ) : (
                      <EmptyAttentionState />
                    )}
                  </div>
                </section>

                {/* Property Health Table - Bottom section */}
                <section>
                  <h2 className="text-sm font-medium text-foreground mb-3">All properties</h2>
                  <PropertyHealthTable />
                </section>
              </>
            )}
          </>
        ) : (
          <AnalyticsMode />
        )}
      </div>
    </AppShell>
  );
};

export default Index;
