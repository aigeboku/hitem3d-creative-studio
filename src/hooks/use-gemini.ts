"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import type { ReferenceImage } from "@/types/gemini";

export function useGemini() {
  const { geminiApiKey, addGeneratedImage } = useAppStore();

  const generateImage = useCallback(
    async (prompt: string, promptLabel: string, referenceImages: ReferenceImage[]) => {
      if (!geminiApiKey) {
        throw new Error("Gemini API key is not set");
      }

      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Key": geminiApiKey,
        },
        body: JSON.stringify({
          prompt,
          referenceImages,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (data.imageData) {
        const mimeType = data.mimeType || "image/png";
        const dataUrl = `data:${mimeType};base64,${data.imageData}`;
        const image = {
          id: crypto.randomUUID(),
          dataUrl,
          promptLabel,
          prompt,
          timestamp: Date.now(),
        };
        addGeneratedImage(image);
        return image;
      }

      throw new Error("No image in response");
    },
    [geminiApiKey, addGeneratedImage]
  );

  return { generateImage };
}
