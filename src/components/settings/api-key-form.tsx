"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCredentialsStatus } from "@/hooks/use-credentials-status";
import { useI18n } from "@/hooks/use-i18n";

export function ApiKeyForm() {
  const { status, refresh } = useCredentialsStatus();
  const { t } = useI18n();
  const [accessKey, setAccessKey] = useState("");
  const [apiSecretKey, setApiSecretKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const saveCredentials = async (): Promise<boolean> => {
    const response = await fetch("/api/hitem3d/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey, secretKey: apiSecretKey }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { valid?: boolean; error?: string }
      | null;

    if (!response.ok || !payload?.valid) {
      throw new Error(payload?.error || t("Failed to save Hitem3D credentials."));
    }

    await refresh();
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    setBalance(null);

    try {
      await saveCredentials();
      setSuccess("Credentials saved securely.");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleCheckBalance = async () => {
    setChecking(true);
    setError(null);
    setSuccess(null);
    setBalance(null);

    try {
      if (accessKey && apiSecretKey) {
        await saveCredentials();
      }

      const balanceResponse = await fetch("/api/hitem3d/balance");
      const payload = (await balanceResponse.json().catch(() => null)) as
        | { balance?: number; error?: string }
        | null;

      if (!balanceResponse.ok || typeof payload?.balance !== "number") {
        throw new Error(payload?.error || t("Failed to check balance."));
      }

      setBalance(payload.balance);
      setSuccess("Credentials verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Unknown error"));
    } finally {
      setChecking(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setError(null);
    setSuccess(null);
    setBalance(null);

    try {
      const response = await fetch("/api/hitem3d/auth", { method: "DELETE" });
      if (!response.ok) {
        throw new Error(t("Failed to clear stored credentials."));
      }
      setAccessKey("");
      setApiSecretKey("");
      await refresh();
      setSuccess("Stored credentials were cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Unknown error"));
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Hitem3D API")}</CardTitle>
        <CardDescription>
          {t("Enter your Hitem3D Access Key and Secret Key, then save securely.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hitem3d-access-key">{t("Access Key")}</Label>
          <Input
            id="hitem3d-access-key"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="your-access-key"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hitem3d-api-key">{t("Secret Key")}</Label>
          <div className="flex gap-2">
            <Input
              id="hitem3d-api-key"
              type={showPassword ? "text" : "password"}
              value={apiSecretKey}
              onChange={(e) => setApiSecretKey(e.target.value)}
              placeholder="your-secret-key"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPassword((prev) => !prev)}
              className="shrink-0"
            >
              {showPassword ? t("Hide") : t("Show")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSave}
            variant="outline"
            disabled={!accessKey || !apiSecretKey || saving || checking || clearing}
          >
            {saving ? t("Saving...") : t("Save Credentials")}
          </Button>
          <Button onClick={handleCheckBalance} disabled={checking || saving || clearing}>
            {checking ? t("Checking...") : t("Validate & Check Balance")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={clearing || saving || checking}
          >
            {clearing ? t("Clearing...") : t("Clear Stored Credentials")}
          </Button>
        </div>

        {status.hasHitem3dCredentials && (
          <p className="text-sm text-muted-foreground">
            {t("Credentials are currently stored for this browser.")}
          </p>
        )}

        {balance !== null && (
          <p className="text-sm text-green-600">
            {t("Balance")}: {balance} {t("credits")}
          </p>
        )}

        {success && <p className="text-sm text-green-600">{t(success)}</p>}
        {error && <p className="text-sm text-red-600">{t(error)}</p>}
      </CardContent>
    </Card>
  );
}
