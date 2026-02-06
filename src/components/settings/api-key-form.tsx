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

export function ApiKeyForm() {
  const { status, refresh } = useCredentialsStatus();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      body: JSON.stringify({ username, password }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { valid?: boolean; error?: string }
      | null;

    if (!response.ok || !payload?.valid) {
      throw new Error(payload?.error || "Failed to save Hitem3D credentials.");
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
      setError(err instanceof Error ? err.message : "Unknown error");
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
      if (username && password) {
        await saveCredentials();
      }

      const balanceResponse = await fetch("/api/hitem3d/balance");
      const payload = (await balanceResponse.json().catch(() => null)) as
        | { balance?: number; error?: string }
        | null;

      if (!balanceResponse.ok || typeof payload?.balance !== "number") {
        throw new Error(payload?.error || "Failed to check balance.");
      }

      setBalance(payload.balance);
      setSuccess("Credentials verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
        throw new Error("Failed to clear stored credentials.");
      }
      setUsername("");
      setPassword("");
      await refresh();
      setSuccess("Stored credentials were cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hitem3D API</CardTitle>
        <CardDescription>
          Enter your Hitem3D username and password, then save securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hitem3d-username">Username</Label>
          <Input
            id="hitem3d-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hitem3d-password">Password</Label>
          <div className="flex gap-2">
            <Input
              id="hitem3d-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="your-password"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPassword((prev) => !prev)}
              className="shrink-0"
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSave}
            variant="outline"
            disabled={!username || !password || saving || checking || clearing}
          >
            {saving ? "Saving..." : "Save Credentials"}
          </Button>
          <Button onClick={handleCheckBalance} disabled={checking || saving || clearing}>
            {checking ? "Checking..." : "Validate & Check Balance"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={clearing || saving || checking}
          >
            {clearing ? "Clearing..." : "Clear Stored Credentials"}
          </Button>
        </div>

        {status.hasHitem3dCredentials && (
          <p className="text-sm text-muted-foreground">
            Credentials are currently stored for this browser.
          </p>
        )}

        {balance !== null && (
          <p className="text-sm text-green-600">Balance: {balance} credits</p>
        )}

        {success && <p className="text-sm text-green-600">{success}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
