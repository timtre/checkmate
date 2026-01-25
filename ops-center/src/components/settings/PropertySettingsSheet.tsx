import { useState, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPropertyData, useCreateGuestToken, useUploadPropertyImage } from '@/lib/api';
import { AlertTriangle, Loader2, Trash2, Link, Copy, Check, Upload, ImageIcon } from 'lucide-react';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface PropertySettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName: string;
  propertyImageUrl?: string;
}

export function PropertySettingsSheet({
  open,
  onOpenChange,
  propertyId,
  propertyName,
  propertyImageUrl,
}: PropertySettingsSheetProps) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState('');

  const resetMutation = useResetPropertyData();
  const tokenMutation = useCreateGuestToken();
  const uploadImageMutation = useUploadPropertyImage();

  const guestAppUrl = import.meta.env.VITE_GUEST_APP_URL || 'http://localhost:8080';

  const handleGenerateToken = async () => {
    if (!guestName.trim()) return;
    try {
      const result = await tokenMutation.mutateAsync({
        propertyId,
        guestName: guestName.trim(),
      });
      setGeneratedLink(`${guestAppUrl}/chat/${result.token}`);
      setGuestName('');
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync({ propertyId });
      setAlertOpen(false);
      onOpenChange(false);
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('File too large. Maximum size is 5MB.');
      return;
    }

    try {
      await uploadImageMutation.mutateAsync({ propertyId, file });
    } catch {
      setImageError('Failed to upload image. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Property Settings</SheetTitle>
          <SheetDescription>
            Manage settings for {propertyName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)] pb-6">
          {/* Property Cover Image */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Cover Image</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a cover image for your property. This will be displayed on the property overview.
            </p>

            {propertyImageUrl ? (
              <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                <img
                  src={propertyImageUrl}
                  alt="Property cover"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No cover image</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImageMutation.isPending}
              variant="outline"
              className="w-full gap-2"
            >
              {uploadImageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadImageMutation.isPending
                ? 'Uploading...'
                : propertyImageUrl
                ? 'Change Image'
                : 'Upload Image'}
            </Button>

            <p className="text-xs text-muted-foreground">
              Accepted formats: JPEG, PNG, WebP. Max size: 5MB.
            </p>

            {imageError && (
              <Alert variant="destructive">
                <AlertDescription>{imageError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Guest Link */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Guest Invite Link</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate a unique link for a guest to access the AI concierge.
            </p>

            <div className="space-y-2">
              <Label htmlFor="guest-name">Guest Name</Label>
              <div className="flex gap-2">
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. John Smith"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateToken()}
                />
                <Button
                  onClick={handleGenerateToken}
                  disabled={tokenMutation.isPending || !guestName.trim()}
                >
                  {tokenMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </div>

            {generatedLink && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm break-all">{generatedLink}</code>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}

            {tokenMutation.isError && (
              <p className="text-sm text-destructive">
                Failed to generate link. Please try again.
              </p>
            )}
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Actions here are irreversible. Please proceed with caution.
            </p>

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="w-4 h-4" />
                  Reset Property Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Reset all data for {propertyName}?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>This action will permanently delete:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                      <li>All guest conversations</li>
                      <li>All escalations</li>
                      <li>All insights and analytics</li>
                      <li>All AI suggestions</li>
                      <li>All guest tokens</li>
                    </ul>
                    <p className="font-medium text-foreground">
                      The property itself and its knowledge base will be preserved.
                    </p>
                    <p className="text-destructive font-medium">
                      This action cannot be undone.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={resetMutation.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    disabled={resetMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {resetMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Yes, reset all data'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {resetMutation.isError && (
              <p className="text-sm text-destructive mt-2">
                Failed to reset data. Please try again.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
