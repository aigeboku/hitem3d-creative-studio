"use client";

import { OrbitControls } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { CAMERA_PRESETS } from "@/lib/constants";

interface SceneControlsProps {
  onPresetClick: (position: [number, number, number], label: string) => void;
}

export function SceneControlsUI({ onPresetClick }: SceneControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CAMERA_PRESETS.map((preset) => (
        <Button
          key={preset.label}
          variant="outline"
          size="sm"
          onClick={() => onPresetClick(preset.position, preset.label)}
        >
          {preset.icon} {preset.label}
        </Button>
      ))}
    </div>
  );
}

export function SceneOrbitControls() {
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      makeDefault
    />
  );
}
