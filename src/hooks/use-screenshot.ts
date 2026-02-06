"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import type { Screenshot } from "@/types/app";

export function useScreenshot() {
  const { addScreenshot } = useAppStore();

  const captureScreenshot = useCallback(
    (canvas: HTMLCanvasElement, label: string) => {
      const dataUrl = canvas.toDataURL("image/png");
      const screenshot: Screenshot = {
        id: crypto.randomUUID(),
        dataUrl,
        label,
        timestamp: Date.now(),
      };
      addScreenshot(screenshot);
      return screenshot;
    },
    [addScreenshot]
  );

  return { captureScreenshot };
}
