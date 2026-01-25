import { AppShell } from '@/components/layout/AppShell';
import { DocSuggestionCard } from '@/components/dashboard/DocSuggestionCard';
import {
  topIntents,
  topQuestions,
  docSuggestions,
  getIntentLabel,
  getIntentIcon,
} from '@/lib/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AnalyticsPage = () => {
  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio Analytics</h1>
          <p className="text-muted-foreground">Cross-property insights to improve operations and reduce escalations</p>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Intents */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-6">Top Issue Types</h3>
            <div className="space-y-4">
              {topIntents.map((item, index) => (
                <div key={item.intent} className="flex items-center gap-4">
                  <span className="w-6 text-center text-lg">{getIntentIcon(item.intent as any)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{getIntentLabel(item.intent as any)}</span>
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
          </div>

          {/* Resolution stats */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-6">Resolution Performance</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-success-muted rounded-xl">
                <p className="text-4xl font-bold text-success mb-1">87%</p>
                <p className="text-sm text-muted-foreground">Resolved by AI</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-xl">
                <p className="text-4xl font-bold text-foreground mb-1">13%</p>
                <p className="text-sm text-muted-foreground">Needed Human</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-xl">
                <p className="text-4xl font-bold text-foreground mb-1">2.3m</p>
                <p className="text-sm text-muted-foreground">Avg. Response</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-xl">
                <p className="text-4xl font-bold text-foreground mb-1">4.2★</p>
                <p className="text-sm text-muted-foreground">Guest Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Questions Table */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Top Asked Questions</h3>
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
                const rate = Math.round((item.resolved / item.count) * 100);
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
        </div>

        {/* Documentation Improvements */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Suggested Documentation Improvements</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {docSuggestions.filter((s) => s.status === 'new').length} pending
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            The AI analyzed conversations and found gaps in your documentation that could reduce future escalations.
          </p>
          <div className="space-y-3">
            {docSuggestions.map((suggestion) => (
              <DocSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => console.log('Accept', suggestion.id)}
                onDismiss={() => console.log('Dismiss', suggestion.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default AnalyticsPage;
