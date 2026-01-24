import { useState } from "react";
import { ingestDocument, type DocumentIngestResponse } from "../api";

interface Props {
  propertyId: string;
}

export default function KnowledgePanel({ propertyId }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentIngestResponse | null>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!title.trim() || !content.trim() || !propertyId) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await ingestDocument(propertyId, title, content, category || undefined);
      setResult(res);
      setTitle("");
      setCategory("");
      setContent("");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="knowledge-panel">
      <h2>Knowledge Base</h2>
      <div className="form-group">
        <label>Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
      </div>
      <div className="form-group">
        <label>Category</label>
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. house-rules, faq" />
      </div>
      <div className="form-group">
        <label>Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Document content..." rows={8} />
      </div>
      <button onClick={handleUpload} disabled={loading || !propertyId || !title.trim() || !content.trim()}>
        {loading ? "Uploading..." : "Upload Document"}
      </button>
      {result && (
        <div className="result success">
          Document ingested: {result.document_id} ({result.chunks_created} chunks)
        </div>
      )}
      {error && <div className="result error">{error}</div>}
    </div>
  );
}
