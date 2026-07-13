"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  MeshPhongMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
} from "three";
import { useTexture } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { GLOBE_RADIUS } from "@/lib/constants";
import { vector3ToLatLon } from "@/lib/geo";
import { useGlobeStore } from "@/lib/store";

/** Pixel threshold separating a click from a drag on the sphere. */
const CLICK_DRAG_THRESHOLD_PX = 6;

/**
 * Photorealistic Earth, Google-Earth style: a satellite day map with shiny
 * oceans (specular map) and terrain relief (normal map), lit by the scene's
 * single "sun". Clicking the surface (drag-guarded) drops a pending pin and
 * flies the camera to it.
 */
export default function Earth() {
  const [dayMap, specularMap, normalMap] = useTexture([
    "/textures/earth_day.jpg",
    "/textures/earth_specular.jpg",
    "/textures/earth_normal.jpg",
  ]);

  const earthGeometry = useMemo(
    () => new SphereGeometry(GLOBE_RADIUS, 96, 96),
    [],
  );

  const earthMaterial = useMemo(() => {
    dayMap.colorSpace = SRGBColorSpace;
    dayMap.anisotropy = 8;
    return new MeshPhongMaterial({
      map: dayMap,
      specularMap,
      specular: new Color(0x3a5266),
      normalMap,
      normalScale: new Vector2(0.6, 0.6),
      shininess: 16,
    });
  }, [dayMap, specularMap, normalMap]);

  useEffect(() => {
    return () => {
      earthGeometry.dispose();
      earthMaterial.dispose();
    };
  }, [earthGeometry, earthMaterial]);

  /* -------------------------------------------------- click -> pendingPin */
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    pointerDownAt.current = { x: event.clientX, y: event.clientY };
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    const down = pointerDownAt.current;
    pointerDownAt.current = null;
    if (!down) return;

    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    if (moved >= CLICK_DRAG_THRESHOLD_PX) return; // drag, not a click
    if (!event.point) return;

    event.stopPropagation();
    const { lat, lon } = vector3ToLatLon(event.point);
    useGlobeStore.getState().setPendingPin({ lat, lon });
    useGlobeStore.getState().requestFlyTo(lat, lon);
  };

  return (
    <mesh
      geometry={earthGeometry}
      material={earthMaterial}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    />
  );
}
