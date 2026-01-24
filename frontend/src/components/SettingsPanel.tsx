import { useState } from "react";
import { Save, Link, Copy, CheckCheck, TriangleAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updatePropertyName, createToken, type TokenCreateResponse } from "../api";

interface SettingsPanelProps {
  propertyId: string;
  propertyName: string;
  onNameUpdated: (name: string) => void;
  onReset?: () => void;
}

export default function SettingsPanel({ propertyId, propertyName, onNameUpdated, onReset }: SettingsPanelProps) {
  const [name, setName] = useState(propertyName);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [tokenResult, setTokenResult] = useState<TokenCreateResponse | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [copied, setCopied] = useState(false);

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

  const guestLink = tokenResult
    ? `${window.location.origin}/chat/${tokenResult.token}`
    : null;

  function handleCopy() {
    if (guestLink) {
      navigator.clipboard.writeText(guestLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
