"use client";

import { useMemo } from "react";
import {
  BoxGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { LocationRow } from "@/lib/types";
import { GLOBE_RADIUS, MARKER_ALTITUDE } from "@/lib/constants";
import { latLonToVector3 } from "@/lib/geo";
import { useGlobeStore } from "@/lib/store";

/* ---------------------------------------------------------------------------
   PERFORMANCE CONTRACT: geometry + materials are module-level singletons
   shared by every marker mesh. Highlighting swaps between shared materials —
   never clone, never allocate per marker.
--------------------------------------------------------------------------- */
const markerGeometry = new BoxGeometry(0.018, 0.018, 0.045);

const baseMaterial = new MeshStandardMaterial({
  color: "#ededed",
  roughness: 1,
  metalness: 0,
});

/** Inverted/bright — unlit full white so selection reads as inversion. */
const selectedMaterial = new MeshBasicMaterial({ color: "#ffffff" });

const mutedMaterial = new MeshStandardMaterial({
  color: "#737373",
  roughness: 1,
  metalness: 0,
  transparent: true,
  opacity: 0.7,
});

/** The box's long axis is Z; align it with the surface normal. */
const Z_AXIS = new Vector3(0, 0, 1);

const SELECTED_SCALE = 1.6;

function useMarkerTransform(lat: number, lon: number) {
  return useMemo(() => {
    const position = latLonToVector3(lat, lon, GLOBE_RADIUS + MARKER_ALTITUDE);
    const quaternion = new Quaternion().setFromUnitVectors(
      Z_AXIS,
      position.clone().normalize(),
    );
    return { position, quaternion };
  }, [lat, lon]);
}

function setCursor(cursor: "pointer" | "auto") {
  document.body.style.cursor = cursor;
}

interface LocationMarkerProps {
  location: LocationRow;
  selected: boolean;
}

function LocationMarker({ location, selected }: LocationMarkerProps) {
  const { position, quaternion } = useMarkerTransform(
    location.latitude,
    location.longitude,
  );

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const store = useGlobeStore.getState();
    store.selectLocation(location.id);
    store.requestFlyTo(location.latitude, location.longitude);
  };

  return (
    <mesh
      geometry={markerGeometry}
      material={selected ? selectedMaterial : baseMaterial}
      position={position}
      quaternion={quaternion}
      scale={selected ? SELECTED_SCALE : 1}
      onClick={handleClick}
      onPointerOver={() => setCursor("pointer")}
      onPointerOut={() => setCursor("auto")}
    />
  );
}

interface GhostMarkerProps {
  lat: number;
  lon: number;
}

/** Muted, semi-transparent preview for the not-yet-saved pendingPin. */
function GhostMarker({ lat, lon }: GhostMarkerProps) {
  const { position, quaternion } = useMarkerTransform(lat, lon);

  return (
    <mesh
      geometry={markerGeometry}
      material={mutedMaterial}
      position={position}
      quaternion={quaternion}
    />
  );
}

/** One mesh per saved location plus the pendingPin ghost. */
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
      {pendingPin && (
        <GhostMarker lat={pendingPin.lat} lon={pendingPin.lon} />
      )}
    </group>
  );
}
