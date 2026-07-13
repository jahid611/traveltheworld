"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  CAMERA_MAX_DISTANCE,
  CAMERA_MIN_DISTANCE,
  FLY_TO_DURATION_MS,
} from "@/lib/constants";
import { easeInOutCubic, latLonToVector3 } from "@/lib/geo";
import { useGlobeStore } from "@/lib/store";

const IDENTITY_Q = new Quaternion();

interface TweenState {
  start: number;
  d0: Vector3;
  r0: number;
  r1: number;
  qFull: Quaternion;
}

/**
 * OrbitControls + eased great-circle fly-to tween (ARCHITECTURE.md §5).
 * Gentle idle auto-rotate stops permanently on the first user pointerdown
 * or the first fly-to. User pointerdown cancels an in-flight tween — the
 * user always wins.
 */
export default function CameraRig() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const tweenRef = useRef<TweenState | null>(null);

  // Pre-allocated temp — zero allocations inside useFrame.
  const tmpQ = useRef(new Quaternion());

  const [autoRotate, setAutoRotate] = useState(true);

  const flyTo = useGlobeStore((s) => s.flyTo);

  /* First user pointerdown: kill auto-rotate forever, cancel any tween. */
  useEffect(() => {
    const el = gl.domElement;
    const onPointerDown = () => {
      setAutoRotate(false);
      if (tweenRef.current) {
        tweenRef.current = null;
        if (controlsRef.current) controlsRef.current.enabled = true;
      }
    };
    el.addEventListener("pointerdown", onPointerDown);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, [gl]);

  /* New fly-to intent: capture tween params once; useFrame animates. */
  useEffect(() => {
    if (!flyTo) return;
    setAutoRotate(false);

    const d0 = camera.position.clone().normalize();
    const r0 = camera.position.length();
    const d1 = latLonToVector3(flyTo.lat, flyTo.lon, 1).normalize();

    tweenRef.current = {
      start: performance.now(),
      d0,
      r0,
      r1: flyTo.distance,
      qFull: new Quaternion().setFromUnitVectors(d0, d1),
    };
    if (controlsRef.current) controlsRef.current.enabled = false;
  }, [flyTo, camera]);

  useFrame(() => {
    const tween = tweenRef.current;
    if (!tween) return;

    const t = Math.min(1, (performance.now() - tween.start) / FLY_TO_DURATION_MS);
    const e = easeInOutCubic(t);

    tmpQ.current.slerpQuaternions(IDENTITY_Q, tween.qFull, e);
    camera.position
      .copy(tween.d0)
      .applyQuaternion(tmpQ.current)
      .multiplyScalar(tween.r0 + (tween.r1 - tween.r0) * e);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update?.();

    if (t >= 1) {
      tweenRef.current = null;
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
      minDistance={CAMERA_MIN_DISTANCE}
      maxDistance={CAMERA_MAX_DISTANCE}
      autoRotate={autoRotate}
      autoRotateSpeed={0.25}
    />
  );
}
