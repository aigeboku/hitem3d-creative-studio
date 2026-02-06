"use client";

import { useAppStore } from "@/stores/app-store";

export function ScreenshotGallery() {
  const { screenshots, removeScreenshot } = useAppStore();

  if (screenshots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No screenshots captured yet. Rotate the 3D model and capture angles you want to use.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {screenshots.map((screenshot) => (
        <div key={screenshot.id} className="relative group">
          <img
            src={screenshot.dataUrl}
            alt={screenshot.label}
            className="w-full aspect-square object-cover rounded-lg border"
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-1.5 rounded-b-lg truncate">
            {screenshot.label}
          </div>
          <button
            onClick={() => removeScreenshot(screenshot.id)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
