"use client";

import { useEffect, useRef, useState } from "react";
import { useGlobeStore } from "@/lib/store";
import { searchPlaces } from "@/lib/geocode";
import { formatCoords } from "@/lib/geo";
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
    <div className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-[0_1px_4px_rgba(60,64,67,0.35)] focus-within:shadow-[0_1px_6px_rgba(60,64,67,0.45)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-mute">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
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
          placeholder="Search a city or country"
          aria-label="Search city or country"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-mute"
        />
        {searching && (
          <span
            aria-hidden
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-sun"
          />
        )}
      </div>

      {error && !searching && (
        <p className="error-block absolute top-full right-0 left-0 z-40 mt-2">
          {error}
        </p>
      )}

      {showDropdown && !searching && (
        <div className="panel absolute top-full right-0 left-0 z-40 mt-2 max-h-80 overflow-y-auto p-1">
          {results.map((r, i) => (
            <button
              key={`${r.latitude},${r.longitude},${i}`}
              type="button"
              onClick={() => select(r)}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-raise"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0 text-mute">
                <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">
                  {truncateName(r.name)}
                </span>
                <span className="block font-mono text-[11px] text-mute">
                  {formatCoords(r.latitude, r.longitude)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
