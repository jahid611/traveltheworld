"use client";

import { useEffect, useRef, useState } from "react";
import { useGlobeStore } from "@/lib/store";
import { listMediaWithUrls } from "@/lib/data/media";
import { deleteLocation } from "@/lib/data/locations";
import { formatCoords } from "@/lib/geo";
import { MAX_MEDIA_PER_LOCATION } from "@/lib/constants";
import { Uploader } from "@/components/media/Uploader";
import { MediaGrid } from "@/components/media/MediaGrid";

const CONFIRM_WINDOW_MS = 3000;

/** Right-hand panel for the selected pin: identity, media, delete. */
export default function LocationPanel() {
  const selectedLocationId = useGlobeStore((s) => s.selectedLocationId);
  const location = useGlobeStore(
    (s) => s.locations.find((l) => l.id === s.selectedLocationId) ?? null,
  );
  const selectLocation = useGlobeStore((s) => s.selectLocation);
  const setMediaForLocation = useGlobeStore((s) => s.setMediaForLocation);
  const removeLocation = useGlobeStore((s) => s.removeLocation);
  const mediaCount = useGlobeStore((s) =>
    s.selectedLocationId
      ? (s.mediaByLocation[s.selectedLocationId] ?? []).length
      : 0,
  );

  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  // Load media whenever the selected location changes.
  useEffect(() => {
    if (!selectedLocationId) return;
    let cancelled = false;
    setMediaLoading(true);
    setMediaError(null);
    listMediaWithUrls(selectedLocationId)
      .then((items) => {
        if (cancelled) return;
        setMediaForLocation(selectedLocationId, items);
        setMediaLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMediaError(
          err instanceof Error ? err.message : "FAILED TO LOAD MEDIA",
        );
        setMediaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLocationId, setMediaForLocation]);

  // Reset the delete confirmation when switching pins.
  useEffect(() => {
    setConfirmingDelete(false);
    setDeleting(false);
    setDeleteError(null);
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, [selectedLocationId]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  if (!location) return null;

  const handleDelete = async () => {
    if (deleting) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      confirmTimerRef.current = window.setTimeout(() => {
        setConfirmingDelete(false);
        confirmTimerRef.current = null;
      }, CONFIRM_WINDOW_MS);
      return;
    }
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteLocation(location);
      removeLocation(location.id);
    } catch (err) {
      setDeleting(false);
      setConfirmingDelete(false);
      setDeleteError(
        err instanceof Error ? err.message : "FAILED TO DELETE LOCATION",
      );
    }
  };

  return (
    <aside className="panel absolute top-20 right-4 bottom-16 z-20 flex w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div className="min-w-0">
          <span className="label">Place</span>
          <h2 className="mt-0.5 text-xl leading-tight font-medium break-words text-fg">
            {location.name}
          </h2>
          <p className="mt-1 font-mono text-xs text-mute">
            {formatCoords(location.latitude, location.longitude)} ·{" "}
            {new Date(location.created_at).toISOString().slice(0, 10)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => selectLocation(null)}
          aria-label="Close panel"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-raise hover:text-fg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <span className="label">
          Media · {mediaCount}/{MAX_MEDIA_PER_LOCATION}
        </span>

        {mediaLoading && <span className="label">Loading media…</span>}
        {mediaError && <p className="error-block">{mediaError}</p>}

        <Uploader location={location} />
        <MediaGrid location={location} />
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-line p-4">
        {deleteError && <p className="error-block">{deleteError}</p>}
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className={`w-full rounded-full px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
            confirmingDelete
              ? "bg-coral text-white hover:opacity-90"
              : "text-coral hover:bg-[#fce8e6]"
          }`}
        >
          {deleting
            ? "Deleting…"
            : confirmingDelete
              ? "Confirm delete"
              : "Delete place"}
        </button>
      </div>
    </aside>
  );
}
