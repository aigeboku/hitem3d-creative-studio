"use client";

import { Button } from "@/components/ui/button";

interface ScreenshotButtonProps {
  onCapture: () => void;
  disabled?: boolean;
}

export function ScreenshotButton({ onCapture, disabled }: ScreenshotButtonProps) {
  return (
    <Button onClick={onCapture} disabled={disabled} className="w-full">
      📸 Capture Screenshot
    </Button>
  );
}
