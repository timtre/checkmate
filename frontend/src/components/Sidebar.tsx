import { useState } from "react";
import { Home, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { PropertyItem } from "../api";

interface SidebarProps {
  properties: PropertyItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: (id: string, name: string) => void;
}

export default function Sidebar({ properties, selectedId, onSelect, onAdd }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");

  const filtered = properties.filter(
    (p) =>
      p.property_id.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    const id = newId.trim();
    if (!id) return;
    onAdd(id, newName.trim());
    setNewId("");
    setNewName("");
    setShowAdd(false);
  }

  return (
    <aside className="w-[260px] border-r bg-sidebar-background flex flex-col h-screen">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-primary">Checkmate</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
          Properties
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-4">No properties found.</p>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((p) => (
              <button
                key={p.property_id}
                onClick={() => onSelect(p.property_id)}
                className={`w-full flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent ${
                  p.property_id === selectedId
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground"
                }`}
              >
                <span className="truncate">
                  {p.name || p.property_id}
                </span>
                <span className="ml-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {p.conversation_count}
                </span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div className="p-3">
        {showAdd ? (
          <div className="space-y-2">
            <Input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="Property ID"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Display name (optional)"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newId.trim()} className="flex-1">
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        )}
      </div>
    </aside>
  );
}
