import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { EscalationCard } from '@/components/dashboard/EscalationCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { escalations } from '@/lib/mockData';

const InboxPage = () => {
  const [activeTab, setActiveTab] = useState('urgent');

  const urgentEscalations = escalations.filter(
    (e) => e.pmActionType === 'NOTIFY_PM_URGENT' && e.status !== 'resolved' && e.status !== 'closed'
  );
  const needsInputEscalations = escalations.filter(
    (e) => e.pmActionType === 'REQUEST_PM_INPUT' && e.status !== 'resolved' && e.status !== 'closed'
  );
  const fyiEscalations = escalations.filter(
    (e) => e.pmActionType === 'NOTIFY_PM_PASSIVE' && e.status !== 'resolved' && e.status !== 'closed'
  );
  const closedEscalations = escalations.filter(
    (e) => e.status === 'resolved' || e.status === 'closed'
  );

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Escalations</h1>
          <p className="text-sm text-muted-foreground">All properties</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-4 h-auto p-0">
            <TabsTrigger
              value="urgent"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-sm"
            >
              Urgent
              {urgentEscalations.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-critical text-critical-foreground text-xs">
                  {urgentEscalations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="input"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-sm"
            >
              Needs Input
              {needsInputEscalations.length > 0 && (
                <span className="ml-1.5 text-muted-foreground">
                  {needsInputEscalations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="fyi"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-sm"
            >
              FYI
              {fyiEscalations.length > 0 && (
                <span className="ml-1.5 text-muted-foreground">
                  {fyiEscalations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="closed"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-sm"
            >
              Closed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urgent" className="mt-4">
            {urgentEscalations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No urgent escalations</p>
            ) : (
              <div>
                {urgentEscalations.map((escalation) => (
                  <EscalationCard key={escalation.id} escalation={escalation} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="input" className="mt-4">
            {needsInputEscalations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No escalations need input</p>
            ) : (
              <div>
                {needsInputEscalations.map((escalation) => (
                  <EscalationCard key={escalation.id} escalation={escalation} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fyi" className="mt-4">
            {fyiEscalations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No FYI notifications</p>
            ) : (
              <div>
                {fyiEscalations.map((escalation) => (
                  <EscalationCard key={escalation.id} escalation={escalation} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed" className="mt-4">
            {closedEscalations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No closed escalations</p>
            ) : (
              <div>
                {closedEscalations.map((escalation) => (
                  <EscalationCard key={escalation.id} escalation={escalation} compact />
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