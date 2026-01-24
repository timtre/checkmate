import { useState } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ingestDocument, type DocumentIngestResponse } from "../api";

interface Props {
  propertyId: string;
  onUploaded?: () => void;
}

const CATEGORIES = [
  { value: "", label: "Select category..." },
  { value: "house-rules", label: "House Rules" },
  { value: "faq", label: "FAQ" },
  { value: "amenities", label: "Amenities" },
  { value: "check-in", label: "Check-in/Check-out" },
  { value: "local-area", label: "Local Area" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
];

export default function KnowledgePanel({ propertyId, onUploaded }: Props) {
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
      onUploaded?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="doc-title">Title</Label>
          <Input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-category">Category</Label>
          <Select
            id="doc-category"
            value={category}
            onValueChange={setCategory}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-content">Content</Label>
          <Textarea
            id="doc-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type document content..."
            rows={8}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={loading || !title.trim() || !content.trim()}
          className="w-full"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Uploading..." : "Upload Document"}
        </Button>

        {result && (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Document ingested ({result.chunks_created} chunks created).
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
