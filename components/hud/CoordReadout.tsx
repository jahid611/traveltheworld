"use client";

import { useGlobeStore } from "@/lib/store";
import { formatCoords } from "@/lib/geo";

/** Google-Earth-style live readout: where the camera looks + its altitude. */
export default function CoordReadout() {
  const view = useGlobeStore((s) => s.cameraView);
  if (!view) return null;

  const alt = Math.max(0, Math.round(view.altitudeKm));
  const altLabel =
    alt >= 1000 ? `${(alt / 1000).toFixed(alt >= 10000 ? 0 : 1)} thousand km` : `${alt} km`;

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
      <span className="g-readout">
        <span>{formatCoords(view.lat, view.lon)}</span>
        <span className="text-white/40">·</span>
        <span>camera {altLabel}</span>
      </span>
    </div>
  );
}
