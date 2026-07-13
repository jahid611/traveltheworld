"use client";

import { useRef, useState } from "react";
import { useGlobeStore } from "@/lib/store";
import { uploadMedia } from "@/lib/data/media";
import {
  MAX_IMAGE_MB,
  MAX_MEDIA_PER_LOCATION,
  MAX_VIDEO_SECONDS,
} from "@/lib/constants";
import type { LocationRow } from "@/lib/types";

export interface UploaderProps {
  location: LocationRow;
}

/**
 * Hidden file input + full-width brutalist button. Uploads sequentially,
 * pushing each success into the store immediately; failures are collected
 * and reported without aborting the batch.
 */
export function Uploader({ location }: UploaderProps) {
  const count = useGlobeStore(
    (s) => (s.mediaByLocation[location.id] ?? []).length,
  );
  const addMediaItem = useGlobeStore((s) => s.addMediaItem);

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const full = count >= MAX_MEDIA_PER_LOCATION;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0 || busy) return;
    setErrors([]);
    setNotice(null);

    const current = (
      useGlobeStore.getState().mediaByLocation[location.id] ?? []
    ).length;
    const slots = MAX_MEDIA_PER_LOCATION - current;
    if (slots <= 0) return;

    let selected = files;
    if (files.length > slots) {
      selected = files.slice(0, slots);
      setNotice(
        `ONLY ${slots} SLOT${slots === 1 ? "" : "S"} LEFT — ${
          files.length - slots
        } FILE(S) SKIPPED`,
      );
    }

    setBusy(true);
    const failed: string[] = [];
    for (let i = 0; i < selected.length; i += 1) {
      const file = selected[i];
      if (!file) continue;
      setProgress(`UPLOADING ${i + 1}/${selected.length} — ${file.name}`);
      try {
        const item = await uploadMedia(location, file);
        addMediaItem(location.id, item);
      } catch (err) {
        failed.push(
          `${file.name} — ${
            err instanceof Error ? err.message : "UPLOAD FAILED"
          }`,
        );
      }
    }
    setProgress(null);
    setBusy(false);
    setErrors(failed);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          // Clear so re-selecting the same file fires onChange again.
          e.target.value = "";
          void handleFiles(files);
        }}
      />

      <button
        type="button"
        className="btn w-full"
        disabled={full || busy}
        onClick={() => inputRef.current?.click()}
      >
        + ADD MEDIA (IMAGES / VIDEO ≤{MAX_VIDEO_SECONDS}S)
      </button>

      <span className="label">
        IMAGES -&gt; WEBP ≤{MAX_IMAGE_MB}MB // VIDEO ≤{MAX_VIDEO_SECONDS}S
      </span>

      {full && (
        <span className="label">
          MEDIA LIMIT REACHED — MAX {MAX_MEDIA_PER_LOCATION} PER LOCATION
        </span>
      )}

      {progress && <span className="label">{progress}</span>}

      {notice && <p className="notice-block">{notice}</p>}

      {errors.length > 0 && (
        <div className="error-block">
          {errors.map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      )}
    </div>
  );
}
