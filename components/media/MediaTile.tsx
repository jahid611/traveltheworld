"use client";

import { useEffect, useRef, useState } from "react";
import { useGlobeStore } from "@/lib/store";
import { deleteMedia } from "@/lib/data/media";
import type { MediaItem } from "@/lib/types";

const CONFIRM_WINDOW_MS = 3000;
const ERROR_FLASH_MS = 2500;

export interface MediaTileProps {
  locationId: string;
  item: MediaItem;
}

/** Square media cell with type tag and a two-step hover delete. */
export function MediaTile({ locationId, item }: MediaTileProps) {
  const removeMediaItem = useGlobeStore((s) => s.removeMediaItem);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
      if (errorTimerRef.current !== null) {
        window.clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    if (deleting) return;
    if (!confirming) {
      setConfirming(true);
      confirmTimerRef.current = window.setTimeout(() => {
        setConfirming(false);
        confirmTimerRef.current = null;
      }, CONFIRM_WINDOW_MS);
      return;
    }
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setDeleting(true);
    try {
      await deleteMedia(item);
      removeMediaItem(locationId, item.id);
    } catch {
      setDeleting(false);
      setConfirming(false);
      setFailed(true);
      errorTimerRef.current = window.setTimeout(() => {
        setFailed(false);
        errorTimerRef.current = null;
      }, ERROR_FLASH_MS);
    }
  };

  return (
    <div className="group relative aspect-square overflow-hidden bg-ink">
      {item.signedUrl ? (
        item.media_type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.signedUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            src={item.signedUrl}
            controls
            preload="metadata"
            playsInline
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-raise">
          <span className="text-[11px] text-mute">Unavailable</span>
        </div>
      )}

      {/* Type tag */}
      <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white">
        {item.media_type === "image" ? "Photo" : "Video"}
      </span>

      {/* Two-step delete — hover on pointer devices, focus-within for touch/kb */}
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        aria-label={confirming ? "Confirm delete media" : "Delete media"}
        className={`absolute top-1 right-1 grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[11px] font-medium opacity-0 shadow transition group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100 disabled:opacity-40 ${
          confirming ? "bg-coral text-white" : "bg-white/90 text-fg hover:bg-white"
        }`}
      >
        {deleting ? "…" : confirming ? "Sure?" : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {failed && (
        <div className="error-block absolute inset-x-0 bottom-0 rounded-none text-center !text-[10px]">
          Delete failed
        </div>
      )}
    </div>
  );
}
