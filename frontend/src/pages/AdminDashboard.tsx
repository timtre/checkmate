import { useState, useEffect, useCallback } from "react";
import {
  getProperties,
  getInsights,
  getEscalations,
  getDocuments,
  createProperty,
  type PropertyItem,
  type InsightsResponse,
  type EscalationItem,
  type KnowledgeBaseDocument,
} from "../api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import StatsOverview from "../components/StatsOverview";
import EscalationCard, { EscalationsEmptyState } from "../components/EscalationCard";
import InsightsTable from "../components/InsightsTable";
import DocumentsTable from "../components/DocumentsTable";
import KnowledgePanel from "../components/KnowledgePanel";
import SettingsPanel from "../components/SettingsPanel";

export default function AdminDashboard() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem("propertyId") || "");
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [escalationFilter, setEscalationFilter] = useState<"open" | "all">("open");
  const [activeTab, setActiveTab] = useState("escalations");

  useEffect(() => {
    getProperties()
      .then((res) => setProperties(res.properties))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (propertyId) localStorage.setItem("propertyId", propertyId);
  }, [propertyId]);

  const fetchData = useCallback(async () => {
    if (!propertyId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [insightsRes, escalationsRes, documentsRes] = await Promise.all([
        getInsights(propertyId),
        getEscalations(propertyId, escalationFilter === "open" ? "open" : undefined),
        getDocuments(propertyId),
      ]);
      setInsights(insightsRes);
      setEscalations(escalationsRes.escalations);
      setDocuments(documentsRes.documents);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [propertyId, escalationFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleReplied(id: string) {
    setEscalations((prev) => prev.filter((e) => e.escalation_id !== id));
  }

  async function handleAddProperty(id: string, name: string) {
    if (!properties.some((p) => p.property_id === id)) {
      await createProperty(id, name).catch(() => {});
      setProperties((prev) => [...prev, { property_id: id, name, conversation_count: 0 }]);
    }
    setPropertyId(id);
  }

  function handleNameUpdated(name: string) {
    setProperties((prev) =>
      prev.map((p) => (p.property_id === propertyId ? { ...p, name } : p))
    );
  }

  const currentProperty = properties.find((p) => p.property_id === propertyId);
  const propertyName = currentProperty?.name || "";
  const openCount = escalations.filter((e) => !e.pm_reply).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        properties={properties}
        selectedId={propertyId}
        onSelect={setPropertyId}
        onAdd={handleAddProperty}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <AdminHeader
          propertyId={propertyId}
          propertyName={propertyName}
          loading={loading}
          onRefresh={fetchData}
        />

        {!propertyId && (
          <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
            <p>Select a property from the sidebar to get started.</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {propertyId && (
          <>
            <StatsOverview
              conversations={insights?.total_conversations ?? 0}
              messages={insights?.total_messages ?? 0}
              escalations={insights?.total_escalations ?? 0}
              loading={loading && !insights}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="escalations">
                  Escalations
                  {openCount > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">
                      {openCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="escalations" className="space-y-4 mt-4">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setEscalationFilter("open")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      escalationFilter === "open"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setEscalationFilter("all")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      escalationFilter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    All
                  </button>
                </div>

                {escalations.length === 0 ? (
                  <EscalationsEmptyState />
                ) : (
                  escalations.map((esc) => (
                    <EscalationCard
                      key={esc.escalation_id}
                      escalation={esc}
                      onReplied={handleReplied}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="insights" className="space-y-4 mt-4">
                <InsightsTable title="Most Asked Questions" items={insights?.most_asked ?? []} />
                <InsightsTable title="Worst Answered Questions" items={insights?.worst_answered ?? []} />
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-4 mt-4">
                <KnowledgePanel propertyId={propertyId} onUploaded={fetchData} />
                <DocumentsTable documents={documents} />
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <SettingsPanel
                  propertyId={propertyId}
                  propertyName={propertyName}
                  onNameUpdated={handleNameUpdated}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
