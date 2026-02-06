"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";

interface ScreenshotButtonProps {
  onCapture: () => void;
  disabled?: boolean;
}

export function ScreenshotButton({ onCapture, disabled }: ScreenshotButtonProps) {
  const { t } = useI18n();

  return (
    <Button onClick={onCapture} disabled={disabled} className="w-full">
      📸 {t("Capture Screenshot")}
    </Button>
  );
}
