import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ModeToggle } from '@/components/dashboard/ModeToggle';
import { NeedsAttentionCard, EmptyAttentionState } from '@/components/dashboard/NeedsAttentionCard';
import { SuggestionCard } from '@/components/dashboard/SuggestionCard';
import { PropertyHealthTable } from '@/components/dashboard/PropertyHealthTable';
import { AnalyticsMode } from '@/components/dashboard/AnalyticsMode';
import { escalations, docSuggestions } from '@/lib/mockData';

const Index = () => {
  const [mode, setMode] = useState<'ops' | 'analytics'>('ops');

  const needsAttention = escalations
    .filter((e) => e.status === 'open')
    .sort((a, b) => {
      // Sort by priority first (critical > high > medium > low)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Then by time (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const suggestions = docSuggestions.filter((s) => s.status === 'new').slice(0, 3);

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in max-w-6xl">
        {/* Header with mode toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {mode === 'ops' ? 'Good morning' : 'Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'ops' 
                ? `${needsAttention.length} items need your attention`
                : 'Review trends and improve operations'
              }
            </p>
          </div>
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>

        {mode === 'ops' ? (
          <>
            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Needs Attention - Primary focus */}
              <section className="lg:col-span-3">
                <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  {needsAttention.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-warning" />
                  )}
                  Needs your attention
                </h2>
                <div className="rounded-lg border border-border/50 bg-card px-4">
                  {needsAttention.length > 0 ? (
                    needsAttention.map((escalation) => (
                      <NeedsAttentionCard key={escalation.id} escalation={escalation} />
                    ))
                  ) : (
                    <EmptyAttentionState />
                  )}
                </div>
              </section>

              {/* Suggested Improvements */}
              <section className="lg:col-span-2">
                <h2 className="text-sm font-medium text-foreground mb-3">
                  Suggested improvements
                </h2>
                <div className="space-y-3">
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onAccept={() => console.log('Accepted:', suggestion.id)}
                        onDismiss={() => console.log('Dismissed:', suggestion.id)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No suggestions right now ✨
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Property Health Table */}
            <PropertyHealthTable />
          </>
        ) : (
          <AnalyticsMode />
        )}
      </div>
    </AppShell>
  );
};

export default Index;
