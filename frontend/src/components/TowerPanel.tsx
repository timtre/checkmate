import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, Play, RefreshCw, Layers } from "lucide-react";
import {
  getTowerTables,
  getTowerTablePreview,
  triggerFeaturesJob,
  type TowerTable,
  type TowerTablePreview,
} from "../api";

interface TowerPanelProps {
  propertyId: string;
}

export default function TowerPanel({ propertyId }: TowerPanelProps) {
  const [tables, setTables] = useState<TowerTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [preview, setPreview] = useState<TowerTablePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobRunning, setJobRunning] = useState(false);
  const [error, setError] = useState("");
  const [jobSuccess, setJobSuccess] = useState("");

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTowerTables();
      setTables(res.tables);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreview = useCallback(async (tableName: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await getTowerTablePreview(tableName, 5);
      setPreview(res);
      setSelectedTable(tableName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, []);

  const [needsDeploy, setNeedsDeploy] = useState(false);

  const handleRunFeatures = useCallback(async () => {
    if (!propertyId || jobRunning) return;
    setJobRunning(true);
    setError("");
    setJobSuccess("");
    setNeedsDeploy(false);
    try {
      const res = await triggerFeaturesJob(propertyId);
      setJobSuccess(
        `Feature job started${res.run_number ? ` (run #${res.run_number})` : ""}`
      );
      // Refresh tables after a delay to show new data
      setTimeout(() => fetchTables(), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start job";
      if (msg.includes("not deployed") || msg.includes("404")) {
        setNeedsDeploy(true);
      }
      setError(msg);
    } finally {
      setJobRunning(false);
    }
  }, [propertyId, jobRunning, fetchTables]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Tower Iceberg Tables
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchTables}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleRunFeatures}
              disabled={jobRunning || !propertyId}
            >
              <Play className="h-3 w-3 mr-1" />
              {jobRunning ? "Running..." : "Run Features Job"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-2">
                <p>{error}</p>
                {needsDeploy && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-xs font-mono">
                    <p className="font-semibold mb-1">To deploy the Tower app, run:</p>
                    <code>cd backend/tower/features && tower deploy</code>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {jobSuccess && (
          <Alert>
            <AlertDescription className="text-emerald-700">{jobSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Tables List */}
        {tables.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Iceberg tables found</p>
            <p className="text-xs mt-1">
              Run the Features Job to compute pattern embeddings
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tables.map((table) => (
              <div
                key={`${table.namespace}.${table.name}`}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTable === table.name
                    ? "bg-primary/5 border-primary/30"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => fetchPreview(table.name)}
              >
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{table.name}</p>
                    <p className="text-xs text-muted-foreground">
                      namespace: {table.namespace}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {table.record_count !== null
                    ? `${table.record_count} records`
                    : "Unknown size"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Table Preview */}
        {preview && selectedTable && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Preview: {preview.table_name}
              </h4>
              <span className="text-xs text-muted-foreground">
                Showing {preview.preview.length} of {preview.total_records} records
              </span>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {preview.preview.length > 0 &&
                      Object.keys(preview.preview[0]).map((key) => (
                        <TableHead key={key} className="text-xs">
                          {key}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.preview.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j} className="text-xs truncate max-w-[200px]">
                          {String(val)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
