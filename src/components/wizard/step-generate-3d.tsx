"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/stores/app-store";
import { useHitem3d } from "@/hooks/use-hitem3d";
import { useShallow } from "zustand/react/shallow";
import { useI18n } from "@/hooks/use-i18n";

export function StepGenerate3D() {
  const {
    uploadedImage,
    uploadedImageFile,
    taskStatus,
    taskProgress,
    glbUrl,
    setCurrentStep,
  } = useAppStore(
    useShallow((state) => ({
      uploadedImage: state.uploadedImage,
      uploadedImageFile: state.uploadedImageFile,
      taskStatus: state.taskStatus,
      taskProgress: state.taskProgress,
      glbUrl: state.glbUrl,
      setCurrentStep: state.setCurrentStep,
    }))
  );

  const { generate3DModel, stopPolling } = useHitem3d();
  const { t } = useI18n();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleGenerate = async () => {
    if (!uploadedImageFile) return;

    setGenerating(true);
    setError(null);

    try {
      await generate3DModel(uploadedImageFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to generate 3D model"));
      stopPolling();
    } finally {
      setGenerating(false);
    }
  };

  const statusLabel = (() => {
    switch (taskStatus) {
      case "waiting":
        return t("Waiting in queue...");
      case "processing":
        return `${t("Generating...")} ${taskProgress}%`;
      case "success":
        return t("3D model generated!");
      case "failed":
        return t("Generation failed");
      default:
        return t("Ready to generate");
    }
  })();

  const progressValue = (() => {
    if (taskStatus === "waiting") return 10;
    if (taskStatus === "processing") return Math.max(20, taskProgress);
    if (taskStatus === "success") return 100;
    return 0;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Step 2: Generate 3D Model")}</CardTitle>
        <CardDescription>
          {t("Convert your image to a 3D model using Hitem3D.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadedImage && (
          <div className="flex justify-center">
            <img
              src={uploadedImage}
              alt={t("Source")}
              className="max-h-40 rounded-lg border object-contain"
            />
          </div>
        )}

        {(generating || taskStatus) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{statusLabel}</span>
              <span className="text-muted-foreground">{progressValue}%</span>
            </div>
            <Progress value={progressValue} />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{t(error)}</p>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(1)}
            disabled={generating}
          >
            {t("Back Button")}
          </Button>

          <div className="flex gap-2">
            {!glbUrl && (
              <Button
                onClick={handleGenerate}
                disabled={generating || !uploadedImageFile}
              >
                {generating ? t("Generating...") : t("Generate 3D Model")}
              </Button>
            )}

            {glbUrl && (
              <Button onClick={() => setCurrentStep(3)}>
                {t("Next: View & Screenshot")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
