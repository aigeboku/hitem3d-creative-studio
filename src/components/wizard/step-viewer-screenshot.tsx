"use client";

import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModelViewer } from "@/components/three-viewer/model-viewer";
import { SceneControlsUI } from "@/components/three-viewer/scene-controls";
import { ScreenshotButton } from "@/components/three-viewer/screenshot-button";
import { ScreenshotGallery } from "@/components/three-viewer/screenshot-gallery";
import { useAppStore } from "@/stores/app-store";
import { useScreenshot } from "@/hooks/use-screenshot";
import { useShallow } from "zustand/react/shallow";

export function StepViewerScreenshot() {
  const { glbUrl, screenshots, setCurrentStep } = useAppStore(
    useShallow((state) => ({
      glbUrl: state.glbUrl,
      screenshots: state.screenshots,
      setCurrentStep: state.setCurrentStep,
    }))
  );
  const { captureScreenshot } = useScreenshot();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [screenshotLabel, setScreenshotLabel] = useState("Custom Angle");
  const [currentAngle, setCurrentAngle] = useState("Custom Angle");
  const [targetCameraPosition, setTargetCameraPosition] = useState<
    [number, number, number] | null
  >(null);

  const handleCapture = useCallback(() => {
    if (!canvasRef.current) return;
    captureScreenshot(canvasRef.current, screenshotLabel || currentAngle);
  }, [captureScreenshot, screenshotLabel, currentAngle]);

  const handlePresetClick = useCallback(
    (position: [number, number, number], label: string) => {
      setCurrentAngle(label);
      setScreenshotLabel(label);
      setTargetCameraPosition([...position] as [number, number, number]);
    },
    []
  );

  if (!glbUrl) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No 3D model available. Please go back and generate one first.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: View & Capture Screenshots</CardTitle>
        <CardDescription>
          Rotate the 3D model to your desired angle and capture screenshots.
          These will be used as reference for AI image generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelViewer
          glbUrl={glbUrl}
          canvasRef={canvasRef}
          targetCameraPosition={targetCameraPosition}
        />

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Preset Angles</h4>
          <SceneControlsUI onPresetClick={handlePresetClick} />
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Screenshot Label</label>
            <Input
              value={screenshotLabel}
              onChange={(e) => setScreenshotLabel(e.target.value)}
              placeholder="e.g., Front View"
            />
          </div>
          <ScreenshotButton onCapture={handleCapture} />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Captured Screenshots ({screenshots.length})
          </h4>
          <ScreenshotGallery />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep(4)}
            disabled={screenshots.length === 0}
          >
            Next: Generate Images ({screenshots.length} screenshots)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
