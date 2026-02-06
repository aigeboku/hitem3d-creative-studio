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
  const generationAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      generationAbortRef.current?.abort();
    };
  }, []);

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

    const total = selectedPrompts.length;
    setTotalCount(total);

    // Build reference images: original + screenshots
    const referenceImages: ReferenceImage[] = [];

    if (uploadedImage) {
      const parsed = parseDataUrl(uploadedImage);
      if (!parsed) {
        setGenerating(false);
        setErrors(["Invalid uploaded image data. Please upload the image again."]);
        return;
      }

      referenceImages.push({
        base64: parsed.base64,
        mimeType: parsed.mimeType,
        label: "Original image",
      });
    }

    for (const ss of screenshots) {
      const parsed = parseDataUrl(ss.dataUrl);
      if (!parsed) {
        setGenerating(false);
        setErrors([`Invalid screenshot data: ${ss.label}`]);
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

        await generateImage(fullPrompt, promptItem.label, referenceImages, {
          signal: controller.signal,
        });
      } catch (err) {
        if (
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          break;
        }

        const msg = err instanceof Error ? err.message : "Generation failed";
        if (mountedRef.current) {
          setErrors((prev) => [...prev, `${promptItem.label}: ${msg}`]);
        }
      }

      if (mountedRef.current) {
        setCompletedCount((prev) => prev + 1);
      }
    }

    generationAbortRef.current = null;
    if (mountedRef.current) {
      setGenerating(false);
    }
  }, [
    selectedPrompts,
    customPrompt,
    uploadedImage,
    screenshots,
    generateImage,
    clearGeneratedImages,
  ]);

  const progressValue =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: AI Image Generation</CardTitle>
        <CardDescription>
          Generate new images using the original image and 3D screenshots as
          references.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reference images summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Reference Images</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {uploadedImage && (
              <div className="shrink-0 relative">
                <img
                  src={uploadedImage}
                  alt="Original"
                  className="w-16 h-16 object-cover rounded border-2 border-blue-500"
                />
                <span className="absolute -top-1 -left-1 bg-blue-500 text-white text-[10px] px-1 rounded">
                  Original
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
              <span>Generating images...</span>
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
                {err}
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
              ? `Generating (${completedCount}/${totalCount})...`
              : `Generate ${selectedPrompts.length} Images`}
          </Button>
        </div>

        {/* Results */}
        <ResultsGallery />

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(3)}
            disabled={generating}
          >
            Back to Screenshots
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep(1);
            }}
            disabled={generating}
          >
            Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
