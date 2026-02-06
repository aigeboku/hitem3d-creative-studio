"use client";

import { useAppStore } from "@/stores/app-store";
import { WizardStepper } from "./wizard-stepper";
import { StepUpload } from "./step-upload";
import { StepGenerate3D } from "./step-generate-3d";
import { StepViewerScreenshot } from "./step-viewer-screenshot";
import { StepImageGeneration } from "./step-image-generation";

export function WizardContainer() {
  const currentStep = useAppStore((state) => state.currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <WizardStepper currentStep={currentStep} />

      {currentStep === 1 && <StepUpload />}
      {currentStep === 2 && <StepGenerate3D />}
      {currentStep === 3 && <StepViewerScreenshot />}
      {currentStep === 4 && <StepImageGeneration />}
    </div>
  );
}
