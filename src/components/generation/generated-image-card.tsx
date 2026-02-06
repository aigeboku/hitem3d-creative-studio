"use client";

import { Button } from "@/components/ui/button";
import type { GeneratedImage } from "@/types/app";
import { useI18n } from "@/hooks/use-i18n";

interface GeneratedImageCardProps {
  image: GeneratedImage;
  onClick?: () => void;
}

export function GeneratedImageCard({ image, onClick }: GeneratedImageCardProps) {
  const { t } = useI18n();

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = `generated_${image.promptLabel.replace(/\s+/g, "_")}.png`;
    link.click();
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div
        className="cursor-pointer"
        onClick={onClick}
      >
        <img
          src={image.dataUrl}
          alt={image.promptLabel}
          className="w-full aspect-square object-cover"
        />
      </div>
      <div className="p-2 space-y-1">
        <p className="text-sm font-medium truncate">{image.promptLabel}</p>
        <Button variant="outline" size="sm" className="w-full" onClick={handleDownload}>
          {t("Download")}
        </Button>
      </div>
    </div>
  );
}
