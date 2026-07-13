import { Vector3 } from "three";
import { GLOBE_RADIUS } from "@/lib/constants";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * [lat, lon] -> Vector3 on a Y-up sphere.
 * North pole on +Y, (0°, 0°) on +Z, longitude increases eastward (towards +X).
 *
 *   x = R · cos φ · sin λ
 *   y = R · sin φ
 *   z = R · cos φ · cos λ
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number = GLOBE_RADIUS,
  target: Vector3 = new Vector3(),
): Vector3 {
  const phi = lat * DEG2RAD;
  const lambda = lon * DEG2RAD;
  const cosPhi = Math.cos(phi);
  return target.set(
    radius * cosPhi * Math.sin(lambda),
    radius * Math.sin(phi),
    radius * cosPhi * Math.cos(lambda),
  );
}

/** Exact inverse of latLonToVector3 (any non-zero radius). */
export function vector3ToLatLon(v: Vector3): { lat: number; lon: number } {
  const r = v.length();
  if (r === 0) return { lat: 0, lon: 0 };
  const lat = Math.asin(Math.min(1, Math.max(-1, v.y / r))) * RAD2DEG;
  const lon = Math.atan2(v.x, v.z) * RAD2DEG;
  return { lat, lon };
}

/** Cubic ease-in-out on t ∈ [0, 1]. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** "48.86°N 2.35°E" — brutalist coordinate readout. */
export function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}
