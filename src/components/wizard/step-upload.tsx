"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageDropzone } from "@/components/upload/image-dropzone";
import { useAppStore } from "@/stores/app-store";
import { useCredentialsStatus } from "@/hooks/use-credentials-status";
import { useShallow } from "zustand/react/shallow";
import { useI18n } from "@/hooks/use-i18n";

export function StepUpload() {
  const { uploadedImage, setCurrentStep } = useAppStore(
    useShallow((state) => ({
      uploadedImage: state.uploadedImage,
      setCurrentStep: state.setCurrentStep,
    }))
  );
  const { status, loading } = useCredentialsStatus();
  const { t } = useI18n();
  const missingKeys =
    !status.hasHitem3dCredentials || !status.hasGeminiApiKey;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Step 1: Upload Image")}</CardTitle>
        <CardDescription>
          {t("Upload an image to generate a 3D model from it.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {missingKeys && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {loading ? (
                t("Checking credential status...")
              ) : (
                <>
                  {t("Please configure both API credentials in")}{" "}
                  <a href="/settings" className="underline font-medium">
                    {t("Settings")}
                  </a>{" "}
                  {t("before proceeding.")}
                </>
              )}
            </p>
          </div>
        )}

        <ImageDropzone />

        <div className="flex justify-end">
          <Button
            onClick={() => setCurrentStep(2)}
            disabled={!uploadedImage || missingKeys || loading}
          >
            {t("Next: Generate 3D Model")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
