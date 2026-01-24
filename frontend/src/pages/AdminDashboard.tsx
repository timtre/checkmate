import { useState, useEffect, useCallback } from "react";
import {
  getProperties,
  getInsights,
  getEscalations,
  createProperty,
  deleteEscalation,
  deleteConversationsByGuest,
  deleteAllConversations,
  deleteInsights,
  type PropertyItem,
  type InsightsResponse,
  type EscalationItem,
} from "../api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import StatsOverview from "../components/StatsOverview";
import EscalationCard, { EscalationsEmptyState } from "../components/EscalationCard";
import InsightsTable from "../components/InsightsTable";
import SuggestionsPanel from "../components/SuggestionsPanel";
import PropertyDocumentEditor from "../components/PropertyDocumentEditor";
import SettingsPanel from "../components/SettingsPanel";
import ConfirmDialog from "../components/ConfirmDialog";

export default function AdminDashboard() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem("propertyId") || "");
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [escalationFilter, setEscalationFilter] = useState<"open" | "all">("open");
  const [tenantFilter, setTenantFilter] = useState("");
  const [activeTab, setActiveTab] = useState("escalations");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

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
      const [insightsRes, escalationsRes] = await Promise.all([
        getInsights(propertyId),
        getEscalations(propertyId, escalationFilter === "open" ? "open" : undefined),
      ]);
      setInsights(insightsRes);
      setEscalations(escalationsRes.escalations);
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

  const uniqueGuests = [...new Set(escalations.map((e) => e.guest_name).filter(Boolean))].sort();

  const filteredEscalations = tenantFilter
    ? escalations.filter((e) => e.guest_name === tenantFilter)
    : escalations;

  function handleDeleteEscalation(id: string) {
    setConfirmDialog({
      open: true,
      title: "Delete Escalation",
      description: "Are you sure you want to delete this escalation? This cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await deleteEscalation(id);
        setEscalations((prev) => prev.filter((e) => e.escalation_id !== id));
      },
    });
  }

  function handleDeleteByGuest() {
    if (!tenantFilter) return;
    setConfirmDialog({
      open: true,
      title: "Delete Guest Data",
      description: `Delete all conversations and escalations for "${tenantFilter}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await deleteConversationsByGuest(propertyId, tenantFilter);
        setTenantFilter("");
        fetchData();
      },
    });
  }

  function handleDeleteAll() {
    setConfirmDialog({
      open: true,
      title: "Delete All Data",
      description:
        "Delete ALL conversations and escalations for this property? This cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await deleteAllConversations(propertyId);
        setTenantFilter("");
        fetchData();
      },
    });
  }

  function handleDeleteInsights() {
    setConfirmDialog({
      open: true,
      title: "Delete Insights",
      description:
        "Delete all question pattern insights for this property? This cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await deleteInsights(propertyId);
        fetchData();
      },
    });
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
                <div className="flex gap-2 mb-2 flex-wrap items-center">
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

                  {uniqueGuests.length > 0 && (
                    <select
                      value={tenantFilter}
                      onChange={(e) => setTenantFilter(e.target.value)}
                      className="px-3 py-1 text-sm rounded-md border bg-background"
                    >
                      <option value="">All Guests</option>
                      {uniqueGuests.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="ml-auto flex gap-2">
                    {tenantFilter && (
                      <button
                        onClick={handleDeleteByGuest}
                        className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        Delete Guest Data
                      </button>
                    )}
                    {escalations.length > 0 && (
                      <button
                        onClick={handleDeleteAll}
                        className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>

                {filteredEscalations.length === 0 ? (
                  <EscalationsEmptyState />
                ) : (
                  filteredEscalations.map((esc) => (
                    <EscalationCard
                      key={esc.escalation_id}
                      escalation={esc}
                      onReplied={handleReplied}
                      onDelete={handleDeleteEscalation}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="insights" className="space-y-4 mt-4">
                {(insights?.most_asked?.length || insights?.worst_answered?.length) ? (
                  <div className="flex justify-end">
                    <button
                      onClick={handleDeleteInsights}
                      className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Delete All
                    </button>
                  </div>
                ) : null}
                <InsightsTable title="Most Asked Questions" items={insights?.most_asked ?? []} />
                <InsightsTable title="Worst Answered Questions" items={insights?.worst_answered ?? []} />
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-4 mt-4">
                <SuggestionsPanel propertyId={propertyId} onApproved={fetchData} />
                <PropertyDocumentEditor propertyId={propertyId} />
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

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
