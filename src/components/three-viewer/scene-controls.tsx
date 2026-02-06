"use client";

import { useThree } from "@react-three/fiber";
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

// Hook to animate camera to a preset position
export function useCameraAnimation() {
  const { camera } = useThree();

  const animateToPosition = (position: [number, number, number]) => {
    const [x, y, z] = position;
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };

  return { animateToPosition };
}
