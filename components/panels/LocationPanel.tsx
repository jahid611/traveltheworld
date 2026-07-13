"use client";

import { useEffect, useRef, useState } from "react";
import { useGlobeStore } from "@/lib/store";
import { listMediaWithUrls } from "@/lib/data/media";
import { deleteLocation } from "@/lib/data/locations";
import { formatCoords } from "@/lib/geo";
import { MAX_MEDIA_PER_LOCATION } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
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
    <aside className="panel absolute top-14 right-0 bottom-8 z-20 flex w-full max-w-sm flex-col overflow-hidden border-l">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div className="min-w-0">
          <span className="label">LOCATION</span>
          <h2 className="mt-1 text-lg font-bold break-words uppercase">
            {location.name}
          </h2>
          <p className="mt-1 text-xs text-mute">
            {formatCoords(location.latitude, location.longitude)} //{" "}
            {new Date(location.created_at).toISOString().slice(0, 10)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => selectLocation(null)}
          aria-label="Close panel"
          className="shrink-0 border border-line px-2 py-0.5 text-xs font-bold text-fg hover:bg-fg hover:text-ink"
        >
          X
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <span className="label">
          MEDIA {mediaCount}/{MAX_MEDIA_PER_LOCATION}
        </span>

        {mediaLoading && <span className="label">LOADING MEDIA…</span>}
        {mediaError && <p className="error-block">{mediaError}</p>}

        <Uploader location={location} />
        <MediaGrid location={location} />
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-line p-4">
        {deleteError && <p className="error-block">{deleteError}</p>}
        <Button
          variant={confirmingDelete ? "invert" : "solid"}
          className="w-full"
          onClick={() => void handleDelete()}
          disabled={deleting}
        >
          {deleting
            ? "DELETING…"
            : confirmingDelete
              ? "CONFIRM DELETE?"
              : "DELETE LOCATION"}
        </Button>
      </div>
    </aside>
  );
}
