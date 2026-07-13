"use client";

import { useMemo } from "react";
import { AdditiveBlending, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { LocationRow } from "@/lib/types";
import { GLOBE_RADIUS, MARKER_ALTITUDE } from "@/lib/constants";
import { latLonToVector3 } from "@/lib/geo";
import { useGlobeStore } from "@/lib/store";

/* ---------------------------------------------------------------------------
   PERFORMANCE CONTRACT: geometry + materials are module-level singletons
   shared by every marker mesh. Highlighting swaps between shared materials
   and scales the mesh — never clone, never allocate per marker.
--------------------------------------------------------------------------- */
const coreGeometry = new SphereGeometry(0.016, 20, 20);
const haloGeometry = new SphereGeometry(0.03, 20, 20);

/** Unlit so beacons glow regardless of scene lighting. */
const baseMaterial = new MeshBasicMaterial({ color: "#f2a25c" }); // amber
const selectedMaterial = new MeshBasicMaterial({ color: "#fff1d6" }); // bright gold
const mutedMaterial = new MeshBasicMaterial({
  color: "#f6ecdb",
  transparent: true,
  opacity: 0.6,
}); // pendingPin ghost

const haloMaterial = new MeshBasicMaterial({
  color: "#f2a25c",
  transparent: true,
  opacity: 0.28,
  blending: AdditiveBlending,
  depthWrite: false,
});
const selectedHaloMaterial = new MeshBasicMaterial({
  color: "#e8705f",
  transparent: true,
  opacity: 0.5,
  blending: AdditiveBlending,
  depthWrite: false,
});

const SELECTED_SCALE = 1.5;

function useMarkerPosition(lat: number, lon: number): Vector3 {
  return useMemo(
    () => latLonToVector3(lat, lon, GLOBE_RADIUS + MARKER_ALTITUDE),
    [lat, lon],
  );
}

function setCursor(cursor: "pointer" | "auto") {
  document.body.style.cursor = cursor;
}

interface LocationMarkerProps {
  location: LocationRow;
  selected: boolean;
}

function LocationMarker({ location, selected }: LocationMarkerProps) {
  const position = useMarkerPosition(location.latitude, location.longitude);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const store = useGlobeStore.getState();
    store.selectLocation(location.id);
    store.requestFlyTo(location.latitude, location.longitude);
  };

  return (
    <group position={position} scale={selected ? SELECTED_SCALE : 1}>
      <mesh
        geometry={haloGeometry}
        material={selected ? selectedHaloMaterial : haloMaterial}
      />
      <mesh
        geometry={coreGeometry}
        material={selected ? selectedMaterial : baseMaterial}
        onClick={handleClick}
        onPointerOver={() => setCursor("pointer")}
        onPointerOut={() => setCursor("auto")}
      />
    </group>
  );
}

/** Muted, semi-transparent preview for the not-yet-saved pendingPin. */
function GhostMarker({ lat, lon }: { lat: number; lon: number }) {
  const position = useMarkerPosition(lat, lon);
  return (
    <group position={position}>
      <mesh geometry={haloGeometry} material={haloMaterial} />
      <mesh geometry={coreGeometry} material={mutedMaterial} />
    </group>
  );
}

/** One beacon per saved location plus the pendingPin ghost. */
export default function Markers() {
  const locations = useGlobeStore((s) => s.locations);
  const selectedLocationId = useGlobeStore((s) => s.selectedLocationId);
  const pendingPin = useGlobeStore((s) => s.pendingPin);

  return (
    <group>
      {locations.map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          selected={location.id === selectedLocationId}
        />
      ))}
      {pendingPin && <GhostMarker lat={pendingPin.lat} lon={pendingPin.lon} />}
    </group>
  );
}
