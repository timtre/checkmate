import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProperty } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface CreatePropertySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyCreated?: (propertyId: string) => void;
}

export function CreatePropertySheet({
  open,
  onOpenChange,
  onPropertyCreated,
}: CreatePropertySheetProps) {
  const [propertyId, setPropertyId] = useState('');
  const [displayName, setDisplayName] = useState('');

  const createMutation = useCreateProperty();

  const isValid = propertyId.trim() !== '' && displayName.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      const result = await createMutation.mutateAsync({
        property_id: propertyId.trim(),
        name: displayName.trim(),
      });
      // Reset form
      setPropertyId('');
      setDisplayName('');
      // Close sheet
      onOpenChange(false);
      // Notify parent
      onPropertyCreated?.(result.property_id);
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setPropertyId('');
      setDisplayName('');
      createMutation.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create Property</SheetTitle>
          <SheetDescription>
            Add a new property to manage
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="property-id">Property ID</Label>
            <Input
              id="property-id"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="e.g., beach-house-1"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              A unique identifier for the property. Use lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Beach House"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              The name that will be displayed to guests and in the dashboard.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Property'
            )}
          </Button>

          {createMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to create property. Please check that the Property ID is unique and try again.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
