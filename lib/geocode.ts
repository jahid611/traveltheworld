import { NOMINATIM_ENDPOINT } from "@/lib/constants";
import type { GeocodeResult } from "@/lib/types";

interface NominatimRow {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
}

/** Forward geocoding via OpenStreetMap Nominatim (no API key, CORS-enabled). */
export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${NOMINATIM_ENDPOINT}/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("SEARCH FAILED — GEOCODER UNAVAILABLE");
  const rows = (await res.json()) as NominatimRow[];
  return rows
    .map((r) => ({
      name: r.display_name ?? r.name ?? q,
      latitude: Number.parseFloat(r.lat ?? ""),
      longitude: Number.parseFloat(r.lon ?? ""),
    }))
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
}

/** Reverse geocoding for naming globe-click pins. Never throws — falls back to null. */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const url = `${NOMINATIM_ENDPOINT}/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const row = (await res.json()) as NominatimRow;
    return row.display_name ?? row.name ?? null;
  } catch {
    return null;
  }
}
