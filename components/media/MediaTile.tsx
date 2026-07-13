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
        <div className="flex h-full w-full items-center justify-center">
          <span className="label">UNAVAILABLE</span>
        </div>
      )}

      {/* Type tag */}
      <span className="label pointer-events-none absolute bottom-1 left-1 bg-ink/80 px-1">
        {item.media_type === "image" ? "IMG" : "VID"}
      </span>

      {/* Two-step delete — hover on pointer devices, focus-within for touch/kb */}
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        aria-label={confirming ? "Confirm delete media" : "Delete media"}
        className="absolute top-1 right-1 border border-fg bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em] text-fg uppercase opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-fg hover:text-ink focus:opacity-100 disabled:opacity-40"
      >
        {deleting ? "..." : confirming ? "SURE?" : "X"}
      </button>

      {failed && (
        <div className="error-block absolute inset-x-0 bottom-0 !p-1 text-center !text-[10px]">
          DELETE FAILED
        </div>
      )}
    </div>
  );
}
