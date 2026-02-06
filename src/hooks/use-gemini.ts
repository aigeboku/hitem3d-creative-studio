"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import type { ReferenceImage } from "@/types/gemini";

interface GenerateImageResponse {
  imageData?: string;
  mimeType?: string;
  error?: string;
}

interface GenerateImageOptions {
  signal?: AbortSignal;
}

const GEMINI_REQUEST_TIMEOUT_MS = 90_000;

export function useGemini() {
  const addGeneratedImage = useAppStore((state) => state.addGeneratedImage);

  const generateImage = useCallback(
    async (
      prompt: string,
      promptLabel: string,
      referenceImages: ReferenceImage[],
      options?: GenerateImageOptions
    ) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        GEMINI_REQUEST_TIMEOUT_MS
      );
      const externalAbort = () => controller.abort();
      options?.signal?.addEventListener("abort", externalAbort, { once: true });

      try {
        const response = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            referenceImages,
          }),
          signal: controller.signal,
        }).catch((error) => {
          if (
            (error instanceof DOMException && error.name === "AbortError") ||
            (error instanceof Error && error.name === "AbortError")
          ) {
            if (options?.signal?.aborted) {
              const abortError = new Error("Generation cancelled.");
              abortError.name = "AbortError";
              throw abortError;
            }

            throw new Error("Image generation request timed out.");
          }
          throw error;
        });

        const payload = (await response.json().catch(() => null)) as
          | GenerateImageResponse
          | null;

        if (!response.ok || payload?.error) {
          throw new Error(payload?.error || "Failed to generate image.");
        }

        if (!payload?.imageData) {
          throw new Error("No image in response.");
        }

        const mimeType = payload.mimeType || "image/png";
        const dataUrl = `data:${mimeType};base64,${payload.imageData}`;
        const image = {
          id: crypto.randomUUID(),
          dataUrl,
          promptLabel,
          prompt,
          timestamp: Date.now(),
        };
        addGeneratedImage(image);
        return image;
      } finally {
        clearTimeout(timeoutId);
        options?.signal?.removeEventListener("abort", externalAbort);
      }
    },
    [addGeneratedImage]
  );

  return { generateImage };
}
