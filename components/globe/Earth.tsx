"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { GLOBE_RADIUS } from "@/lib/constants";
import { latLonToVector3, vector3ToLatLon } from "@/lib/geo";
import { useGlobeStore } from "@/lib/store";

/** Pixel threshold separating a click from a drag on the sphere. */
const CLICK_DRAG_THRESHOLD_PX = 6;

interface WorldLines {
  lines: [number, number][][]; // NOTE ORDER: [lon, lat]
}

/**
 * The globe body: matte near-black sphere, one LineSegments graticule
 * (15° grid) and one LineSegments of pre-baked country outlines fetched
 * from /data/world-lines.json. Clicking the sphere (drag-guarded) drops
 * a pending pin and flies the camera to it.
 */
export default function Earth() {
  /* ------------------------------------------------------------- sphere */
  const sphereGeometry = useMemo(
    () => new SphereGeometry(GLOBE_RADIUS, 64, 64),
    [],
  );
  const sphereMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#123a52", // deep ocean
        emissive: "#08202f", // keeps the night side from going pure black
        emissiveIntensity: 0.6,
        roughness: 0.82,
        metalness: 0.12,
      }),
    [],
  );

  /* ---------------------------------------------------------- graticule */
  const graticuleGeometry = useMemo(() => {
    const positions: number[] = [];
    const r = GLOBE_RADIUS * 1.0005;
    const v = new Vector3();
    const push = (lat: number, lon: number) => {
      latLonToVector3(lat, lon, r, v);
      positions.push(v.x, v.y, v.z);
    };

    // Parallels every 15° (skip the poles).
    const PARALLEL_STEPS = 128;
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let i = 0; i < PARALLEL_STEPS; i++) {
        push(lat, (i / PARALLEL_STEPS) * 360 - 180);
        push(lat, ((i + 1) / PARALLEL_STEPS) * 360 - 180);
      }
    }

    // Meridians every 15°.
    const MERIDIAN_STEPS = 96;
    for (let lon = -180; lon < 180; lon += 15) {
      for (let i = 0; i < MERIDIAN_STEPS; i++) {
        push((i / MERIDIAN_STEPS) * 180 - 90, lon);
        push(((i + 1) / MERIDIAN_STEPS) * 180 - 90, lon);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const graticuleMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: "#2f5468", // faint teal meridians/parallels
        transparent: true,
        opacity: 0.5,
      }),
    [],
  );

  /* ----------------------------------------------------- country outlines */
  const [outlineGeometry, setOutlineGeometry] =
    useState<BufferGeometry | null>(null);

  const outlineMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: "#e6c375", // warm gold coastlines — the illuminated-atlas look
        transparent: true,
        opacity: 0.92,
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/data/world-lines.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<WorldLines>;
      })
      .then((data) => {
        if (cancelled) return;
        const positions: number[] = [];
        const r = GLOBE_RADIUS * 1.001;
        const v = new Vector3();
        for (const line of data.lines) {
          for (let i = 0; i < line.length - 1; i++) {
            const [lon0, lat0] = line[i];
            const [lon1, lat1] = line[i + 1];
            latLonToVector3(lat0, lon0, r, v);
            positions.push(v.x, v.y, v.z);
            latLonToVector3(lat1, lon1, r, v);
            positions.push(v.x, v.y, v.z);
          }
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute(
          "position",
          new Float32BufferAttribute(positions, 3),
        );
        setOutlineGeometry(geometry);
      })
      .catch(() => {
        // Asset missing or unreachable: globe still renders without outlines.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------- dispose */
  useEffect(() => {
    return () => {
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      graticuleGeometry.dispose();
      graticuleMaterial.dispose();
      outlineMaterial.dispose();
    };
  }, [
    sphereGeometry,
    sphereMaterial,
    graticuleGeometry,
    graticuleMaterial,
    outlineMaterial,
  ]);

  useEffect(() => {
    return () => {
      outlineGeometry?.dispose();
    };
  }, [outlineGeometry]);

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
    <group>
      <mesh
        geometry={sphereGeometry}
        material={sphereMaterial}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      />
      <lineSegments geometry={graticuleGeometry} material={graticuleMaterial} />
      {outlineGeometry && (
        <lineSegments geometry={outlineGeometry} material={outlineMaterial} />
      )}
    </group>
  );
}
