"use client";

import { useState, useCallback } from "react";
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

export function StepImageGeneration() {
  const {
    uploadedImage,
    screenshots,
    currentPrompts,
    clearGeneratedImages,
    setCurrentStep,
  } = useAppStore();

  const { generateImage } = useGemini();

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
      const base64 = uploadedImage.split(",")[1];
      const mimeType = uploadedImage.split(";")[0].split(":")[1];
      referenceImages.push({
        base64,
        mimeType,
        label: "Original image",
      });
    }

    for (const ss of screenshots) {
      const base64 = ss.dataUrl.split(",")[1];
      referenceImages.push({
        base64,
        mimeType: "image/png",
        label: ss.label,
      });
    }

    // Generate images sequentially to avoid rate limits
    for (const promptItem of selectedPrompts) {
      const fullPrompt = customPrompt
        ? `${promptItem.prompt} ${customPrompt}`
        : promptItem.prompt;

      try {
        await generateImage(fullPrompt, promptItem.label, referenceImages);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        setErrors((prev) => [...prev, `${promptItem.label}: ${msg}`]);
      }

      setCompletedCount((prev) => prev + 1);
    }

    setGenerating(false);
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
