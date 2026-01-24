import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  propertyId: string;
  propertyName: string;
  loading: boolean;
  onRefresh: () => void;
}

export default function AdminHeader({ propertyId, propertyName, loading, onRefresh }: AdminHeaderProps) {
  return (
    <header className="flex items-center justify-between pb-4 border-b mb-6">
      <div>
        <h1 className="text-xl font-semibold">
          {propertyName || propertyId || "Checkmate Admin"}
        </h1>
        {propertyName && propertyId && (
          <p className="text-sm text-muted-foreground mt-0.5">{propertyId}</p>
        )}
      </div>
      {propertyId && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading" : "Refresh"}
        </Button>
      )}
    </header>
  );
}
