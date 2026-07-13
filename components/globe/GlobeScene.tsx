"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { CAMERA_INITIAL_DISTANCE } from "@/lib/constants";
import Earth from "@/components/globe/Earth";
import Markers from "@/components/globe/Markers";
import CameraRig from "@/components/globe/CameraRig";

/**
 * Fullscreen R3F canvas. Pure monochrome scene: near-black background,
 * low ambient light plus one soft directional for a flat matte globe.
 * No shadows, no postprocessing; dpr capped at 2.
 */
export default function GlobeScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{
          position: [0, 0, CAMERA_INITIAL_DISTANCE],
          fov: 45,
          near: 0.01,
          far: 100,
        }}
      >
        <color attach="background" args={["#050505"]} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 2, 4]} intensity={0.8} />

        <Suspense fallback={null}>
          <Earth />
          <Markers />
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  );
}
