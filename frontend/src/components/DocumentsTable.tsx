import type { KnowledgeBaseDocument } from "../api";

interface DocumentsTableProps {
  documents: KnowledgeBaseDocument[];
}

export default function DocumentsTable({ documents }: DocumentsTableProps) {
  return (
    <div className="admin-card">
      <h2>
        Knowledge Base Documents
        {documents.length > 0 && (
          <span className="count-badge">{documents.length}</span>
        )}
      </h2>
      {documents.length === 0 ? (
        <p className="notice">No documents ingested for this property.</p>
      ) : (
        <table className="insights-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Chunks</th>
              <th>Content Preview</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.document_id}>
                <td>{doc.title}</td>
                <td>{doc.category}</td>
                <td>{doc.chunk_count}</td>
                <td>{doc.content.length > 150 ? doc.content.slice(0, 150) + "…" : doc.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
