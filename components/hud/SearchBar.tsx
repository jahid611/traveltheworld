"use client";

import { useEffect, useRef, useState } from "react";
import { useGlobeStore } from "@/lib/store";
import { searchPlaces } from "@/lib/geocode";
import { formatCoords } from "@/lib/geo";
import { Input } from "@/components/ui/Input";
import type { GeocodeResult } from "@/lib/types";

const DEBOUNCE_MS = 400;
const MAX_NAME_CHARS = 60;

function truncateName(name: string): string {
  return name.length > MAX_NAME_CHARS
    ? `${name.slice(0, MAX_NAME_CHARS - 3)}...`
    : name;
}

/**
 * Debounced forward geocoding (Nominatim via lib/geocode). A monotonically
 * increasing sequence ref guarantees stale responses never overwrite newer
 * ones. Selecting a result flies the camera and opens the pin dialog.
 */
export default function SearchBar() {
  const requestFlyTo = useGlobeStore((s) => s.requestFlyTo);
  const setPendingPin = useGlobeStore((s) => s.setPendingPin);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const seqRef = useRef(0);
  const blurTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      seqRef.current += 1;
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }
    const seq = ++seqRef.current;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setError(null);
      searchPlaces(q)
        .then((rows) => {
          if (seqRef.current !== seq) return; // stale — a newer query fired
          setResults(rows);
          setOpen(true);
          setSearching(false);
        })
        .catch((err: unknown) => {
          if (seqRef.current !== seq) return;
          setResults([]);
          setError(err instanceof Error ? err.message : "SEARCH FAILED");
          setSearching(false);
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const select = (r: GeocodeResult) => {
    requestFlyTo(r.latitude, r.longitude);
    setPendingPin({
      lat: r.latitude,
      lon: r.longitude,
      suggestedName: r.name,
    });
    seqRef.current += 1; // invalidate any in-flight search
    setQuery("");
    setResults([]);
    setSearching(false);
    setError(null);
    setOpen(false);
  };

  const showDropdown = open && results.length > 0;

  return (
    <div className="relative w-72 lg:w-80">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Small delay so a click on a result row lands before the close.
          blurTimerRef.current = window.setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results.length > 0 && results[0]) {
            e.preventDefault();
            select(results[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="SEARCH CITY / COUNTRY…"
        aria-label="Search city or country"
        autoComplete="off"
        spellCheck={false}
      />

      {searching && (
        <span className="absolute top-full left-0 mt-1 text-[10px] tracking-[0.2em] text-mute uppercase">
          SEARCHING…
        </span>
      )}

      {error && !searching && (
        <p className="error-block absolute top-full right-0 left-0 z-40 mt-1">
          {error}
        </p>
      )}

      {showDropdown && !searching && (
        <div className="panel absolute top-full right-0 left-0 z-40 mt-1 max-h-72 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.latitude},${r.longitude},${i}`}
              type="button"
              onClick={() => select(r)}
              className="flex w-full flex-col gap-0.5 border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-raise"
            >
              <span className="w-full truncate text-xs font-bold text-fg uppercase">
                {truncateName(r.name)}
              </span>
              <span className="text-[10px] tracking-[0.15em] text-mute">
                {formatCoords(r.latitude, r.longitude)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
