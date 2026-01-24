import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  triggerAggregation,
  streamAggregationProgress,
  type AggregationProgress,
} from "../api";

interface AggregationPanelProps {
  propertyId: string;
  onComplete: () => void;
}

const PHASE_NAMES = ["Question Patterns", "Escalation Analysis", "AI Suggestions"];

export default function AggregationPanel({ propertyId, onComplete }: AggregationPanelProps) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<AggregationProgress | null>(null);
  const [error, setError] = useState("");
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleRun = useCallback(async () => {
    if (!propertyId || running) return;
    setError("");
    setRunning(true);
    setProgress({ phase: 0, phase_name: "Starting", status: "progress", percent: 0, detail: "Initializing...", overall_percent: 0 });

    try {
      await triggerAggregation(propertyId);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setRunning(false);
      setProgress(null);
      return;
    }

    const cleanup = streamAggregationProgress(
      propertyId,
      (data) => setProgress(data),
      () => {
        setRunning(false);
        onComplete();
      },
      (errMsg) => {
        setError(errMsg);
        setRunning(false);
      }
    );
    cleanupRef.current = cleanup;
  }, [propertyId, running, onComplete]);

  const overallPercent = progress?.overall_percent ?? 0;
  const completed = progress?.status === "completed";

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleRun}
            disabled={running || !propertyId}
          >
            {running ? "Running..." : "Run Analysis"}
          </Button>
          {!running && !progress && (
            <span className="text-xs text-muted-foreground">
              Aggregate patterns, escalations, and generate AI suggestions
            </span>
          )}
        </div>

        {(running || completed) && progress && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{progress.phase_name || "Starting"}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-muted-foreground text-xs">{progress.detail}</span>
            </div>

            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${overallPercent}%` }}
              />
            </div>

            <div className="flex gap-2">
              {PHASE_NAMES.map((name, i) => {
                const phaseNum = i + 1;
                const isActive = progress.phase === phaseNum;
                const isDone = progress.phase > phaseNum || completed;
                return (
                  <span
                    key={phaseNum}
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : isActive
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    {phaseNum}. {name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={handleRun}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
