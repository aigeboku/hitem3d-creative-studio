"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GenerationConfig } from "@/components/generation/generation-config";
import { ResultsGallery } from "@/components/generation/results-gallery";
import { useAppStore } from "@/stores/app-store";
import { useGemini } from "@/hooks/use-gemini";
import type { PromptItem, ReferenceImage } from "@/types/gemini";
import { parseDataUrl } from "@/lib/data-url";
import { useShallow } from "zustand/react/shallow";
import { useI18n } from "@/hooks/use-i18n";

export function StepImageGeneration() {
  const {
    uploadedImage,
    screenshots,
    currentPrompts,
    clearGeneratedImages,
    setCurrentStep,
  } = useAppStore(
    useShallow((state) => ({
      uploadedImage: state.uploadedImage,
      screenshots: state.screenshots,
      currentPrompts: state.currentPrompts,
      clearGeneratedImages: state.clearGeneratedImages,
      setCurrentStep: state.setCurrentStep,
    }))
  );

  const { generateImage } = useGemini();
  const { t } = useI18n();
  const generationAbortRef = useRef<AbortController | null>(null);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const clearBatchTimeout = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearBatchTimeout();
      generationAbortRef.current?.abort();
    };
  }, [clearBatchTimeout]);

  const [selectedPrompts, setSelectedPrompts] = useState<PromptItem[]>(
    currentPrompts.slice(0, 4)
  );
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const handleGenerate = useCallback(async () => {
    if (selectedPrompts.length === 0) return;

    setGenerating(true);
    clearGeneratedImages();
    setCompletedCount(0);
    setErrors([]);
    clearBatchTimeout();

    const total = selectedPrompts.length;
    setTotalCount(total);
    const batchTimeoutMs = Math.max(4 * 60_000, total * 95_000);
    batchTimeoutRef.current = setTimeout(() => {
      generationAbortRef.current?.abort();
      if (mountedRef.current) {
        setErrors((prev) => [
          ...prev,
          t("Image generation is taking too long. Please try fewer prompts."),
        ]);
      }
    }, batchTimeoutMs);

    try {
      // Build reference images: original + screenshots
      const referenceImages: ReferenceImage[] = [];

      if (uploadedImage) {
        const parsed = parseDataUrl(uploadedImage);
        if (!parsed) {
          setErrors([t("Invalid uploaded image data. Please upload the image again.")]);
          return;
        }

        referenceImages.push({
          base64: parsed.base64,
          mimeType: parsed.mimeType,
          label: t("Original image"),
        });
      }

      for (const ss of screenshots) {
        const parsed = parseDataUrl(ss.dataUrl);
        if (!parsed) {
          setErrors([`${t("Invalid screenshot data:")} ${ss.label}`]);
          return;
        }

        referenceImages.push({
          base64: parsed.base64,
          mimeType: parsed.mimeType,
          label: ss.label,
        });
      }

      // Generate images sequentially to avoid rate limits
      for (const promptItem of selectedPrompts) {
        if (!mountedRef.current) {
          break;
        }

        const fullPrompt = customPrompt
          ? `${promptItem.prompt} ${customPrompt}`
          : promptItem.prompt;

        try {
          const controller = new AbortController();
          generationAbortRef.current = controller;

          await generateImage(fullPrompt, t(promptItem.label), referenceImages, {
            signal: controller.signal,
          });
        } catch (err) {
          if (
            (err instanceof DOMException && err.name === "AbortError") ||
            (err instanceof Error && err.name === "AbortError")
          ) {
            break;
          }

          const msg = err instanceof Error ? err.message : t("Generation failed");
          if (mountedRef.current) {
            setErrors((prev) => [...prev, `${t(promptItem.label)}: ${t(msg)}`]);
          }
        }

        if (mountedRef.current) {
          setCompletedCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("Generation failed");
      if (mountedRef.current) {
        setErrors((prev) => [...prev, t(msg)]);
      }
    } finally {
      generationAbortRef.current = null;
      clearBatchTimeout();
      if (mountedRef.current) {
        setGenerating(false);
      }
    }
  }, [
    selectedPrompts,
    customPrompt,
    uploadedImage,
    screenshots,
    generateImage,
    clearGeneratedImages,
    clearBatchTimeout,
    t,
  ]);

  const handleCancelGeneration = useCallback(() => {
    clearBatchTimeout();
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    if (mountedRef.current) {
      setGenerating(false);
      setErrors((prev) => [...prev, t("Generation cancelled.")]);
    }
  }, [clearBatchTimeout, t]);

  const progressValue =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Step 4: AI Image Generation")}</CardTitle>
        <CardDescription>
          {t(
            "Generate new images using the original image and 3D screenshots as references."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reference images summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t("Reference Images")}</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {uploadedImage && (
              <div className="shrink-0 relative">
                <img
                  src={uploadedImage}
                  alt={t("Original")}
                  className="w-16 h-16 object-cover rounded border-2 border-blue-500"
                />
                <span className="absolute -top-1 -left-1 bg-blue-500 text-white text-[10px] px-1 rounded">
                  {t("Original")}
                </span>
              </div>
            )}
            {screenshots.map((ss) => (
              <div key={ss.id} className="shrink-0 relative">
                <img
                  src={ss.dataUrl}
                  alt={ss.label}
                  className="w-16 h-16 object-cover rounded border"
                />
                <span className="absolute -top-1 -left-1 bg-gray-700 text-white text-[10px] px-1 rounded truncate max-w-[60px]">
                  {ss.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <GenerationConfig
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
          selectedPrompts={selectedPrompts}
          onSelectedPromptsChange={setSelectedPrompts}
        />

        {/* Progress */}
        {generating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t("Generating images...")}</span>
              <span className="text-muted-foreground">
                {completedCount}/{totalCount}
              </span>
            </div>
            <Progress value={progressValue} />
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-1">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-600">
                {t(err)}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={generating || selectedPrompts.length === 0}
            className="flex-1"
          >
            {generating
              ? `${t("Generating...")} (${completedCount}/${totalCount})...`
              : `${t("Generate")} ${selectedPrompts.length} ${t("Images")}`}
          </Button>
          {generating && (
            <Button variant="outline" onClick={handleCancelGeneration}>
              {t("Cancel Generation")}
            </Button>
          )}
        </div>

        {/* Results */}
        <ResultsGallery />

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(3)}
            disabled={generating}
          >
            {t("Back to Screenshots")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep(1);
            }}
            disabled={generating}
          >
            {t("Start Over")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
