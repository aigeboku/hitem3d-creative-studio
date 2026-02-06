"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { GlbModel } from "./glb-model";
import { SceneOrbitControls } from "./scene-controls";
import * as THREE from "three";

interface ModelViewerProps {
  glbUrl: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  targetCameraPosition: [number, number, number] | null;
}

interface CameraTargetControllerProps {
  targetCameraPosition: [number, number, number] | null;
}

function CameraTargetController({
  targetCameraPosition,
}: CameraTargetControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (!targetCameraPosition) return;
    camera.position.set(
      targetCameraPosition[0],
      targetCameraPosition[1],
      targetCameraPosition[2]
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, targetCameraPosition]);

  return null;
}

export function ModelViewer({
  glbUrl,
  canvasRef,
  targetCameraPosition,
}: ModelViewerProps) {
  return (
    <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border">
      <Canvas
        ref={canvasRef}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [2, 1, 2], fov: 50 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#666" wireframe />
            </mesh>
          }
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />
          <GlbModel url={glbUrl} />
          <Environment preset="studio" />
          <SceneOrbitControls />
          <CameraTargetController targetCameraPosition={targetCameraPosition} />
        </Suspense>
      </Canvas>
    </div>
  );
}
