import { useState, useRef } from "react";
import { Save, Link, Copy, CheckCheck, TriangleAlert, Upload, ImageIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updatePropertyName, createToken, uploadPropertyImage, type TokenCreateResponse } from "../api";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface SettingsPanelProps {
  propertyId: string;
  propertyName: string;
  propertyImageUrl?: string;
  onNameUpdated: (name: string) => void;
  onImageUpdated?: (imageUrl: string) => void;
  onReset?: () => void;
}

export default function SettingsPanel({
  propertyId,
  propertyName,
  propertyImageUrl,
  onNameUpdated,
  onImageUpdated,
  onReset,
}: SettingsPanelProps) {
  const [name, setName] = useState(propertyName);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [tokenResult, setTokenResult] = useState<TokenCreateResponse | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [copied, setCopied] = useState(false);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  async function handleSaveName() {
    if (!name.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updatePropertyName(propertyId, name.trim());
      onNameUpdated(name.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateToken() {
    if (!guestName.trim()) return;
    setTokenLoading(true);
    setTokenResult(null);
    setTokenError("");
    try {
      const res = await createToken(propertyId, guestName.trim());
      setTokenResult(res);
      setGuestName("");
    } catch (err) {
      setTokenError(String(err));
    } finally {
      setTokenLoading(false);
    }
  }

  const guestAppUrl = import.meta.env.VITE_GUEST_APP_URL || "http://localhost:8080";
  const guestLink = tokenResult
    ? `${guestAppUrl}/chat/${tokenResult.token}`
    : null;

  function handleCopy() {
    if (guestLink) {
      navigator.clipboard.writeText(guestLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("File too large. Maximum size is 5MB.");
      return;
    }

    setImageUploading(true);
    try {
      const result = await uploadPropertyImage(propertyId, file);
      onImageUpdated?.(result.image_url);
    } catch (err) {
      setImageError(String(err));
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Name</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="prop-name">Display Name</Label>
              <Input
                id="prop-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beach House Malibu"
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
            </div>
            <Button onClick={handleSaveName} disabled={saving || !name.trim()}>
              {saveSuccess ? <CheckCheck className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : saveSuccess ? "Saved" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Cover Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {propertyImageUrl && (
            <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
              <img
                src={propertyImageUrl}
                alt="Property cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {!propertyImageUrl && (
            <div className="w-full h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No cover image uploaded</p>
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
            disabled={imageUploading}
            variant="outline"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {imageUploading ? "Uploading..." : propertyImageUrl ? "Change Image" : "Upload Image"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Accepted formats: JPEG, PNG, WebP. Max size: 5MB.
          </p>

          {imageError && (
            <Alert variant="destructive">
              <AlertDescription>{imageError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guest Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="guest-name">Guest Name</Label>
              <Input
                id="guest-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest name"
                onKeyDown={(e) => e.key === "Enter" && handleGenerateToken()}
              />
            </div>
            <Button onClick={handleGenerateToken} disabled={tokenLoading || !guestName.trim()}>
              <Link className="h-4 w-4" />
              {tokenLoading ? "Generating..." : "Generate"}
            </Button>
          </div>

          {guestLink && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm break-all">{guestLink}</code>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                {copied ? <CheckCheck className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {tokenError && (
            <Alert variant="destructive">
              <AlertDescription>{tokenError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-700 flex items-center gap-2">
            <TriangleAlert className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Reset all conversations, escalations, insights, suggestions, and guest tokens for this property.
            The property itself and its knowledge base will be preserved.
          </p>
          <Button variant="destructive" onClick={onReset}>
            Reset Property Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
