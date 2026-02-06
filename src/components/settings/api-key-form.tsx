"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/stores/app-store";

export function ApiKeyForm() {
  const {
    hitem3dUsername,
    hitem3dPassword,
    setHitem3dCredentials,
  } = useAppStore();

  const [username, setUsername] = useState(hitem3dUsername);
  const [password, setPassword] = useState(hitem3dPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setHitem3dCredentials(username, password);
  };

  const handleCheckBalance = async () => {
    setChecking(true);
    setError(null);
    setBalance(null);

    try {
      // First authenticate
      const authRes = await fetch("/api/hitem3d/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const authData = await authRes.json();
      if (!authRes.ok || authData.code !== 0) {
        throw new Error(authData.message || "Authentication failed");
      }

      const token = authData.data.token;

      // Then check balance
      const balanceRes = await fetch("/api/hitem3d/balance", {
        headers: { "X-Hitem3D-Token": token },
      });
      const balanceData = await balanceRes.json();
      if (!balanceRes.ok || balanceData.code !== 0) {
        throw new Error(balanceData.message || "Failed to check balance");
      }

      setBalance(balanceData.data.balance);
      handleSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hitem3D API</CardTitle>
        <CardDescription>
          Enter your Hitem3D credentials for 3D model generation.
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
              variant="outline"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="shrink-0"
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline">
            Save
          </Button>
          <Button
            onClick={handleCheckBalance}
            disabled={!username || !password || checking}
          >
            {checking ? "Checking..." : "Validate & Check Balance"}
          </Button>
        </div>
        {balance !== null && (
          <p className="text-sm text-green-600">
            Balance: {balance} credits
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
