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
}

function CameraEventListener() {
  const { camera } = useThree();

  useEffect(() => {
    const handleMoveCamera = (e: Event) => {
      const { position } = (e as CustomEvent).detail;
      camera.position.set(position[0], position[1], position[2]);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };

    window.addEventListener("move-camera", handleMoveCamera);
    return () => window.removeEventListener("move-camera", handleMoveCamera);
  }, [camera]);

  return null;
}

export function ModelViewer({ glbUrl, canvasRef }: ModelViewerProps) {
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
          <CameraEventListener />
        </Suspense>
      </Canvas>
    </div>
  );
}
