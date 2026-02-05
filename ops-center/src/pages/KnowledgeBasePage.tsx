import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Building2, Loader2 } from 'lucide-react';
import { MarkdownEditor } from '@/components/knowledge/MarkdownEditor';
import {
  usePropertyDocument,
  useIngestDocument,
} from '@/lib/api';

const KnowledgeBasePage = () => {
  const { selectedProperty, selectProperty, properties } = usePropertyScope();
  const [documentTitle, setDocumentTitle] = useState('Property Guide');
  const [documentContent, setDocumentContent] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const propertyId = selectedProperty?.id ?? null;
  const { data: existingDocument, isLoading: isLoadingDocument } = usePropertyDocument(propertyId);
  const ingestMutation = useIngestDocument();

  // Load existing document content when available
  useEffect(() => {
    if (existingDocument) {
      setDocumentTitle(existingDocument.title);
      setDocumentContent(existingDocument.content);
    } else if (existingDocument === null) {
      // No document exists, reset to defaults
      setDocumentTitle('Property Guide');
      setDocumentContent('');
    }
  }, [existingDocument]);

  // Clear feedback on property change
  useEffect(() => {
    setFeedback(null);
  }, [propertyId]);

  const handleSave = async () => {
    if (!propertyId) return;

    setFeedback(null);
    try {
      await ingestMutation.mutateAsync({
        propertyId,
        title: documentTitle,
        content: documentContent,
      });
      setFeedback({ type: 'success', message: 'Document saved successfully.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save document.' });
    }
  };

  // If accessed directly without property selected, prompt to select property
  if (!selectedProperty) {
    return (
      <AppShell>
        <div className="space-y-6 animate-fade-in max-w-md mx-auto py-12">
          <div>
            <h1 className="text-xl font-semibold text-foreground mb-1">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground">Select a property to configure</p>
          </div>

          <div className="space-y-1">
            {properties.map((property) => (
              <button
                key={property.id}
                onClick={() => selectProperty(property)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{property.name}</p>
                  <p className="text-xs text-muted-foreground">{property.address}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in max-w-2xl">
        {/* Page header */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">{selectedProperty.name}</p>
          <h1 className="text-xl font-semibold text-foreground">Knowledge Base</h1>
        </div>

        {/* House Manual - Markdown Editor */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3">House Manual</h2>

          {isLoadingDocument ? (
            <div className="flex items-center justify-center py-12 border border-dashed border-border rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading document...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="documentTitle" className="text-xs">
                  Document Title
                </Label>
                <Input
                  id="documentTitle"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="e.g., Property Guide"
                  className="h-9"
                />
              </div>
              <MarkdownEditor
                value={documentContent}
                onChange={setDocumentContent}
                defaultTab="preview"
                placeholder="Write your property guide in markdown...

# Welcome to Your Stay

## Check-in Instructions
1. Enter the 4-digit code on the keypad
2. Wait for the green light

## WiFi
- Network: Guest-WiFi
- Password: welcome123

## House Rules
- No smoking
- Quiet hours: 10pm - 8am"
                minHeight={300}
              />
            </div>
          )}

          {feedback && (
            <div
              className={`mt-3 px-3 py-2 rounded-md text-sm ${
                feedback.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {feedback.message}
            </div>
          )}
        </section>

        {/* Access & Check-in */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3">Access & Check-in</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lockType" className="text-xs">
                  Lock Type
                </Label>
                <Input
                  id="lockType"
                  placeholder="e.g., Keypad"
                  defaultValue="Keypad"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="backupAccess" className="text-xs">
                  Backup Access
                </Label>
                <Input id="backupAccess" placeholder="e.g., Key under mat" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkInSteps" className="text-xs">
                Check-in Steps
              </Label>
              <Textarea
                id="checkInSteps"
                placeholder="Step-by-step instructions..."
                className="min-h-[100px] text-sm"
                defaultValue="1. Enter the 4-digit code on the keypad
2. Wait for the green light
3. Take the elevator to your floor"
              />
              <p className="text-xs text-muted-foreground">
                Consider adding: Building entrance photo, floor number
              </p>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={ingestMutation.isPending || !documentTitle.trim()}>
            {ingestMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

export default KnowledgeBasePage;
