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

export function GeminiKeyForm() {
  const { status, refresh } = useCredentialsStatus();
  const { t } = useI18n();
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<"idle" | "valid" | "invalid">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    setValidating(true);
    setResult("idle");
    setError(null);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validate: true, apiKey: key }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { valid?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.valid) {
        throw new Error(payload?.error || t("Validation failed."));
      }

      setResult("valid");
      await refresh();
    } catch (err) {
      setResult("invalid");
      setError(err instanceof Error ? err.message : t("Unknown error"));
    } finally {
      setValidating(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setError(null);
    setResult("idle");

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(t("Failed to clear stored API key."));
      }
      setKey("");
      await refresh();
    } catch (err) {
      setResult("invalid");
      setError(err instanceof Error ? err.message : t("Unknown error"));
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Gemini API")}</CardTitle>
        <CardDescription>
          {t("Enter your Google AI API key and validate it securely.")}{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {t("Get API key")}
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gemini-key">{t("API Key")}</Label>
          <div className="flex gap-2">
            <Input
              id="gemini-key"
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowKey((prev) => !prev)}
              className="shrink-0"
            >
              {showKey ? t("Hide") : t("Show")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleValidate}
            disabled={!key || validating || clearing}
          >
            {validating ? t("Validating...") : t("Validate & Save Key")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={clearing || validating}
          >
            {clearing ? t("Clearing...") : t("Clear Stored Key")}
          </Button>
        </div>

        {status.hasGeminiApiKey && (
          <p className="text-sm text-muted-foreground">
            {t("Gemini API key is currently stored for this browser.")}
          </p>
        )}

        {result === "valid" && (
          <p className="text-sm text-green-600">{t("API key is valid.")}</p>
        )}
        {result === "invalid" && error && (
          <p className="text-sm text-red-600">{t(error)}</p>
        )}
      </CardContent>
    </Card>
  );
}
