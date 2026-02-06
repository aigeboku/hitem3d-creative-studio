"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/stores/app-store";

export function GeminiKeyForm() {
  const { geminiApiKey, setGeminiApiKey } = useAppStore();
  const [key, setKey] = useState(geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setGeminiApiKey(key);
  };

  const handleValidate = async () => {
    setValidating(true);
    setError(null);
    setStatus("idle");

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Key": key,
        },
        body: JSON.stringify({ validate: true }),
      });

      if (res.ok) {
        setStatus("valid");
        handleSave();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Validation failed");
      }
    } catch (err) {
      setStatus("invalid");
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gemini API</CardTitle>
        <CardDescription>
          Enter your Google AI API key for image generation with NanobananaPro.{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Get API key
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gemini-key">API Key</Label>
          <div className="flex gap-2">
            <Input
              id="gemini-key"
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
              className="shrink-0"
            >
              {showKey ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline">
            Save
          </Button>
          <Button
            onClick={handleValidate}
            disabled={!key || validating}
          >
            {validating ? "Validating..." : "Validate Key"}
          </Button>
        </div>
        {status === "valid" && (
          <p className="text-sm text-green-600">API key is valid</p>
        )}
        {status === "invalid" && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
