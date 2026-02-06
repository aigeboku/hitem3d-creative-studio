"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { GeneratedImageCard } from "./generated-image-card";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { parseDataUrl } from "@/lib/data-url";
import { useI18n } from "@/hooks/use-i18n";

export function ResultsGallery() {
  const generatedImages = useAppStore((state) => state.generatedImages);
  const { t } = useI18n();
  const [downloading, setDownloading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) return;

    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("generated_images");
      if (!folder) return;

      for (const image of generatedImages) {
        const parsed = parseDataUrl(image.dataUrl);
        if (!parsed) continue;

        const fileName = `${image.promptLabel.replace(/\s+/g, "_")}.png`;
        folder.file(fileName, parsed.base64, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(
        content,
        `creative_studio_${new Date().toISOString().slice(0, 10)}.zip`
      );
    } catch (error) {
      console.error(`${t("Download failed:")}`, error);
    } finally {
      setDownloading(false);
    }
  };

  if (generatedImages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {t("Generated Images")} ({generatedImages.length})
        </h3>
        <Button
          onClick={handleDownloadAll}
          disabled={downloading}
          variant="outline"
        >
          {downloading ? t("Compressing...") : t("Download All (ZIP)")}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {generatedImages.map((image, index) => (
          <GeneratedImageCard
            key={image.id}
            image={image}
            onClick={() => setPreviewIndex(index)}
          />
        ))}
      </div>

      {/* Lightbox preview */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewIndex(null)}
              className="absolute top-2 right-2 z-10 bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/40 text-lg"
            >
              &times;
            </button>
            <img
              src={generatedImages[previewIndex].dataUrl}
              alt={generatedImages[previewIndex].promptLabel}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPreviewIndex(
                    (previewIndex - 1 + generatedImages.length) %
                      generatedImages.length
                  )
                }
              >
                {t("Previous")}
              </Button>
              <span className="text-white text-sm">
                {previewIndex + 1} / {generatedImages.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPreviewIndex(
                    (previewIndex + 1) % generatedImages.length
                  )
                }
              >
                {t("Next")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
