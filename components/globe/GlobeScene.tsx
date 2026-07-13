"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { CAMERA_INITIAL_DISTANCE } from "@/lib/constants";
import Earth from "@/components/globe/Earth";
import Atmosphere from "@/components/globe/Atmosphere";
import Markers from "@/components/globe/Markers";
import CameraRig from "@/components/globe/CameraRig";

/**
 * Fullscreen R3F canvas — a warm "night atlas": deep sea-night background,
 * a drifting starfield, a soft key light for the ocean terminator, plus a
 * cyan atmosphere halo. No shadows, no postprocessing; dpr capped at 2.
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
        <color attach="background" args={["#05070d"]} />

        {/* Single "sun" key light + generous ambient for a bright, evenly-lit globe. */}
        <ambientLight intensity={0.62} />
        <directionalLight position={[5, 3, 5]} intensity={1.35} color="#fff6ec" />

        <Stars
          radius={90}
          depth={50}
          count={2600}
          factor={3}
          saturation={0}
          fade
          speed={0.3}
        />

        <Suspense fallback={null}>
          <Earth />
          <Atmosphere />
          <Markers />
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  );
}
