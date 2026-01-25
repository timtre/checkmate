import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { EscalationCard } from '@/components/dashboard/EscalationCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { useAllEscalations } from '@/lib/api';
import { Loader2, CheckCircle2 } from 'lucide-react';

const InboxPage = () => {
  const [activeTab, setActiveTab] = useState('open');
  const { properties, selectedProperty, isPropertyView } = usePropertyScope();

  // Get property IDs based on view
  const propertyIds = isPropertyView && selectedProperty
    ? [selectedProperty.id]
    : properties.map((p) => p.id);

  // Fetch escalations from API
  const { data: escalations = [], isLoading, error } = useAllEscalations(propertyIds);

  const openEscalations = escalations.filter(
    (e) => e.status !== 'resolved' && e.status !== 'closed'
  );
  const closedEscalations = escalations.filter(
    (e) => e.status === 'resolved' || e.status === 'closed'
  );

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Failed to load escalations</p>
          <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Escalations</h1>
          <p className="text-sm text-muted-foreground">
            {isPropertyView && selectedProperty
              ? selectedProperty.name
              : 'All properties'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-4 h-auto p-0">
            <TabsTrigger
              value="open"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-sm"
            >
              Open
              {openEscalations.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-critical text-critical-foreground text-xs">
                  {openEscalations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="closed"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-sm"
            >
              Closed
              {closedEscalations.length > 0 && (
                <span className="ml-1.5 text-muted-foreground">
                  {closedEscalations.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-4">
            {openEscalations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-success mb-3" />
                <p className="text-sm font-medium text-foreground">All clear</p>
                <p className="text-xs text-muted-foreground mt-1">No escalations need your attention</p>
              </div>
            ) : (
              <div>
                {openEscalations.map((escalation) => (
                  <EscalationCard key={escalation.id} escalation={escalation} variant="full" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed" className="mt-4">
            {closedEscalations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No resolved escalations yet</p>
            ) : (
              <div>
                {closedEscalations.map((escalation) => (
                  <EscalationCard key={escalation.id} escalation={escalation} variant="closed" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default InboxPage;
