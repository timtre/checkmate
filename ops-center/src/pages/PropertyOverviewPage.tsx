import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import {
  useEscalations,
  useBatchSuggestions,
  useInsights,
  useTopQuestions,
  useUpdateBatchSuggestion,
  deriveIntent,
  type TopIntentItem,
} from '@/lib/api';
import { getIntentLabel, getIntentIcon, type Intent } from '@/lib/mockData';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { AggregationPanel } from '@/components/analytics/AggregationPanel';
import { DocSuggestionCard } from '@/components/dashboard/DocSuggestionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PropertySettingsSheet } from '@/components/settings/PropertySettingsSheet';
import {
  Users,
  AlertTriangle,
  Bot,
  FileText,
  MapPin,
  Home,
  ArrowRight,
  Settings,
  Loader2,
  ImageIcon,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PropertyOverviewPage = () => {
  const { selectedProperty } = usePropertyScope();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);

  const propertyId = selectedProperty?.id ?? null;

  // Fetch data from API - hooks must be called unconditionally
  const { data: propertyEscalations = [], isLoading: escalationsLoading } = useEscalations(propertyId);
  const { data: propertySuggestions = [], isLoading: suggestionsLoading } = useBatchSuggestions(propertyId);
  const { data: insights, isLoading: insightsLoading } = useInsights(propertyId);
  const { data: topQuestions = [], isLoading: questionsLoading } = useTopQuestions(propertyId);
  const updateSuggestion = useUpdateBatchSuggestion();

  // Redirect to all properties view if no property selected
  if (!selectedProperty) {
    return <Navigate to="/" replace />;
  }

  const isLoading = escalationsLoading || suggestionsLoading || insightsLoading || questionsLoading;

  // Filter data
  const openEscalations = propertyEscalations.filter(e => e.status === 'open' || e.status === 'waiting_on_pm');
  const pendingSuggestions = propertySuggestions.filter(s => s.status === 'new');

  // Calculate resolution stats from question patterns
  const totalQuestions = topQuestions.reduce((sum, q) => sum + q.count, 0);
  const totalResolved = topQuestions.reduce((sum, q) => sum + q.resolved, 0);
  const totalEscalations = propertyEscalations.length;
  const resolvedByAI = totalQuestions > 0
    ? Math.round((totalResolved / totalQuestions) * 100)
    : 0;
  const neededHuman = totalQuestions > 0 ? 100 - resolvedByAI : 0;

  // Calculate top intents from escalations
  const intentCounts = new Map<Intent, number>();
  for (const esc of propertyEscalations) {
    const guestMessage = esc.timeline.find(t => t.type === 'guest_message')?.content || '';
    const intent = deriveIntent(guestMessage);
    intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
  }

  const topIntents: TopIntentItem[] = Array.from(intentCounts.entries())
    .map(([intent, count]) => ({
      intent,
      count,
      percentage: propertyEscalations.length > 0
        ? Math.round((count / propertyEscalations.length) * 100)
        : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // FAQ table data (show 3 by default)
  const displayedQuestions = faqExpanded ? topQuestions : topQuestions.slice(0, 3);

  // Suggestions data (show 2 by default)
  const displayedSuggestions = suggestionsExpanded ? pendingSuggestions : pendingSuggestions.slice(0, 2);

  // Handlers for suggestions
  const handleAcceptSuggestion = async (suggestionId: string) => {
    await updateSuggestion.mutateAsync({
      propertyId: selectedProperty.id,
      suggestionId,
      status: 'approved',
    });
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    updateSuggestion.mutate({
      propertyId: selectedProperty.id,
      suggestionId,
      status: 'dismissed',
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Property header with image */}
        <div className="space-y-4">
          {/* Cover image */}
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted">
            {selectedProperty.imageUrl ? (
              <img
                src={selectedProperty.imageUrl}
                alt={`${selectedProperty.name} property`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No cover image</p>
                </div>
              </div>
            )}
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* Property info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-md">{selectedProperty.name}</h1>
              <p className="text-white/90 flex items-center gap-1 drop-shadow-sm">
                <MapPin className="w-3.5 h-3.5" />
                {selectedProperty.address || 'No address'}
              </p>
            </div>
          </div>

          {/* Settings button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
              Property Settings
            </Button>
          </div>
        </div>

        {/* Property KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Units"
            value={selectedProperty.units}
            subtitle="Total units"
            icon={Home}
          />
          <KpiCard
            title="Questions"
            value={totalQuestions}
            subtitle="This month"
            icon={Users}
          />
          <KpiCard
            title="Open Issues"
            value={openEscalations.length}
            subtitle="Needs attention"
            icon={AlertTriangle}
            variant={openEscalations.length > 0 ? 'warning' : 'default'}
          />
          <KpiCard
            title="AI Resolution"
            value={`${resolvedByAI}%`}
            subtitle="This month"
            icon={Bot}
          />
        </div>

        {/* Open Issues Section */}
        {openEscalations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Open Issues</CardTitle>
                <Link to="/escalations">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    View all <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {openEscalations.slice(0, 3).map((esc) => (
                  <Link
                    key={esc.id}
                    to={`/escalation/${esc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{esc.summary}</p>
                      <p className="text-xs text-muted-foreground">{esc.guestName} - {esc.unitName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      esc.priority === 'critical' ? 'bg-critical text-critical-foreground' :
                      esc.priority === 'high' ? 'bg-high text-high-foreground' :
                      'bg-medium text-medium-foreground'
                    }`}>
                      {esc.priority}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Charts + Run Analysis */}
        <div className="space-y-6">
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Intents */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-6">Issue Types</h3>
              {topIntents.length > 0 ? (
                <div className="space-y-4">
                  {topIntents.map((item, index) => (
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

            {/* Resolution Performance */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-6">Resolution Performance</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className={`text-center p-4 rounded-xl ${resolvedByAI >= 70 ? 'bg-success-muted' : resolvedByAI >= 50 ? 'bg-high-muted' : 'bg-critical-muted'}`}>
                  <p className="text-4xl font-bold mb-1 text-foreground">{resolvedByAI}%</p>
                  <p className="text-sm text-muted-foreground">Resolved by AI</p>
                </div>
                <div className={`text-center p-4 rounded-xl ${neededHuman <= 30 ? 'bg-success-muted' : neededHuman <= 50 ? 'bg-high-muted' : 'bg-critical-muted'}`}>
                  <p className="text-4xl font-bold mb-1 text-foreground">{neededHuman}%</p>
                  <p className="text-sm text-muted-foreground">Needed Human</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-xl">
                  <p className="text-4xl font-bold text-foreground mb-1">{totalQuestions}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-xl">
                  <p className="text-4xl font-bold text-foreground mb-1">{totalEscalations}</p>
                  <p className="text-sm text-muted-foreground">Escalations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aggregation Panel */}
          <AggregationPanel propertyId={selectedProperty.id} />
        </div>

        {/* AI Suggestions Section */}
        {pendingSuggestions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Suggestions</CardTitle>
                  <CardDescription>
                    Documentation improvements based on guest conversations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayedSuggestions.map((suggestion) => (
                  <DocSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={() => handleAcceptSuggestion(suggestion.id)}
                    onDismiss={() => handleDismissSuggestion(suggestion.id)}
                  />
                ))}
              </div>
              {pendingSuggestions.length > 2 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                    className="gap-2"
                  >
                    {suggestionsExpanded ? (
                      <>Show less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Show more ({pendingSuggestions.length - 2} more) <ChevronDown className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FAQ Table */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Most common guest questions at {selectedProperty.name}
          </p>
          {topQuestions.length > 0 ? (
            <>
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
                  {displayedQuestions.map((item) => {
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
              {topQuestions.length > 3 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFaqExpanded(!faqExpanded)}
                    className="gap-2"
                  >
                    {faqExpanded ? (
                      <>Show less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Show more ({topQuestions.length - 3} more) <ChevronDown className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No question patterns recorded yet. Click "Run Analysis" above to generate insights from your conversations.</p>
          )}
        </div>

        {/* Knowledge Base Link Card */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Knowledge Base
            </CardTitle>
            <CardDescription>
              Configure check-in instructions, Wi-Fi, and property documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/property/knowledge">
              <Button className="gap-2">
                Edit Documentation
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <PropertySettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        propertyId={selectedProperty.id}
        propertyName={selectedProperty.name}
        propertyImageUrl={selectedProperty.imageUrl}
      />
    </AppShell>
  );
};

export default PropertyOverviewPage;
