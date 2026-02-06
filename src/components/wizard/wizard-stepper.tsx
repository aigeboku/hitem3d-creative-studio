"use client";

import { WIZARD_STEPS } from "@/lib/constants";
import type { WizardStep } from "@/types/app";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

interface WizardStepperProps {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
}

export function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between w-full mb-8">
      {WIZARD_STEPS.map((step, index) => (
        <div key={step.step} className="flex items-center flex-1 last:flex-none">
          <button
            onClick={() => onStepClick?.(step.step as WizardStep)}
            disabled={!onStepClick}
            className="flex items-center gap-2 group"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step.step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.step < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {step.step < currentStep ? "✓" : step.step}
            </div>
            <div className="hidden sm:block text-left">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.step === currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {t(step.label)}
              </p>
              <p className="text-xs text-muted-foreground hidden md:block">
                {t(step.description)}
              </p>
            </div>
          </button>
          {index < WIZARD_STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-px mx-3",
                step.step < currentStep ? "bg-green-500" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
