"use client";

import { useCallback, useEffect, useState } from "react";

interface CredentialsStatus {
  hasHitem3dCredentials: boolean;
  hasGeminiApiKey: boolean;
}

const DEFAULT_STATUS: CredentialsStatus = {
  hasHitem3dCredentials: false,
  hasGeminiApiKey: false,
};

export function useCredentialsStatus() {
  const [status, setStatus] = useState<CredentialsStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/credentials/status", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | CredentialsStatus
        | { error?: string }
        | null;

      if (!response.ok || !payload || !isCredentialsStatus(payload)) {
        const errorMessage =
          payload && typeof payload === "object" && "error" in payload
            ? payload.error
            : undefined;
        throw new Error(
          errorMessage || "Failed to fetch credential status."
        );
      }

      setStatus({
        hasHitem3dCredentials: !!payload.hasHitem3dCredentials,
        hasGeminiApiKey: !!payload.hasGeminiApiKey,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus(DEFAULT_STATUS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    loading,
    error,
    refresh,
  };
}

function isCredentialsStatus(
  payload: CredentialsStatus | { error?: string }
): payload is CredentialsStatus {
  return (
    "hasHitem3dCredentials" in payload && "hasGeminiApiKey" in payload
  );
}
