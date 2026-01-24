import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { getPropertyDocument, ingestDocument } from "../api";

interface Props {
  propertyId: string;
}

export default function PropertyDocumentEditor({ propertyId }: Props) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Property Guide");
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    setLoading(true);
    setFeedback(null);
    getPropertyDocument(propertyId)
      .then((doc) => {
        if (doc) {
          setTitle(doc.title);
          setContent(doc.content);
        } else {
          setTitle("Property Guide");
          setContent("");
        }
      })
      .catch(() => setFeedback({ type: "error", message: "Failed to load document." }))
      .finally(() => setLoading(false));
  }, [propertyId]);

  function startEdit() {
    setDraftTitle(title);
    setDraft(content);
    setEditing(true);
    setFeedback(null);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft("");
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      await ingestDocument(propertyId, draftTitle, draft);
      setTitle(draftTitle);
      setContent(draft);
      setEditing(false);
      setFeedback({ type: "success", message: "Document saved." });
    } catch {
      setFeedback({ type: "error", message: "Failed to save document." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm py-4">Loading document...</p>;
  }

  // Empty state — no document yet
  if (!content && !editing) {
    return (
      <div className="rounded-lg border p-6 space-y-4">
        <p className="text-muted-foreground text-sm">
          No property document yet. Add your property guide in markdown format.
        </p>
        <button
          onClick={() => {
            setDraftTitle("Property Guide");
            setDraft("");
            setEditing(true);
          }}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create Document
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      {/* Header */}
      {!editing && (
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium text-sm">{title}</h3>
          <button
            onClick={startEdit}
            className="px-3 py-1 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
          >
            Edit
          </button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`px-4 py-2 text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Content */}
      {editing ? (
        <div className="p-4 space-y-3">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm font-medium"
            placeholder="Document title"
          />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full min-h-[400px] p-3 rounded-md border bg-background font-mono text-sm resize-y"
            placeholder="Write your property guide in markdown..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !draftTitle.trim()}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
