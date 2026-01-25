import { Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { DocSuggestionCard } from '@/components/dashboard/DocSuggestionCard';
import {
  topIntents,
  topQuestions,
  docSuggestions,
  escalations,
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
import { Building2 } from 'lucide-react';

const PropertyAnalyticsPage = () => {
  const { scope, selectedProperty } = usePropertyScope();

  // Redirect to portfolio if no property selected
  if (scope !== 'property' || !selectedProperty) {
    return <Navigate to="/analytics" replace />;
  }

  // Filter data for this property
  const propertyEscalations = escalations.filter(e => e.propertyId === selectedProperty.id);
  const propertySuggestions = docSuggestions.filter(s => s.propertyId === selectedProperty.id);
  
  const resolvedCount = propertyEscalations.filter(e => e.status === 'resolved' || e.status === 'closed').length;
  const resolvedByAI = propertyEscalations.length > 0 
    ? Math.round((resolvedCount / propertyEscalations.length) * 100) 
    : 87; // Fallback for demo

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        {/* Page header */}
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Building2 className="w-4 h-4" />
            {selectedProperty.name}
          </div>
          <h1 className="text-2xl font-bold text-foreground">Property Analytics</h1>
          <p className="text-muted-foreground">Performance diagnostics for this specific property</p>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Intents for this property */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-6">Issue Types at This Property</h3>
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

          {/* Resolution stats for this property */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-6">Resolution Performance</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-success-muted rounded-xl">
                <p className="text-4xl font-bold text-success mb-1">{resolvedByAI}%</p>
                <p className="text-sm text-muted-foreground">Resolved by AI</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-xl">
                <p className="text-4xl font-bold text-foreground mb-1">{100 - resolvedByAI}%</p>
                <p className="text-sm text-muted-foreground">Needed Human</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-xl">
                <p className="text-4xl font-bold text-foreground mb-1">1.8m</p>
                <p className="text-sm text-muted-foreground">Avg. Response</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-xl">
                <p className="text-4xl font-bold text-foreground mb-1">4.5★</p>
                <p className="text-sm text-muted-foreground">Guest Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Questions for this property */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Most common guest questions at {selectedProperty.name}
          </p>
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

        {/* Documentation Improvements for this property */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Suggested Knowledge Base Improvements</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {propertySuggestions.filter((s) => s.status === 'new').length} pending
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            AI-identified documentation gaps specific to {selectedProperty.name}
          </p>
          <div className="space-y-3">
            {propertySuggestions.length > 0 ? (
              propertySuggestions.map((suggestion) => (
                <DocSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={() => console.log('Accept', suggestion.id)}
                  onDismiss={() => console.log('Dismiss', suggestion.id)}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No documentation improvements suggested for this property
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default PropertyAnalyticsPage;
