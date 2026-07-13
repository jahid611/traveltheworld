"use client";

import { useGlobeStore } from "@/lib/store";
import { MediaTile } from "@/components/media/MediaTile";
import type { LocationRow, MediaItem } from "@/lib/types";

const EMPTY: MediaItem[] = [];

export interface MediaGridProps {
  location: LocationRow;
}

/** Hairline grid of media tiles for one location. */
export function MediaGrid({ location }: MediaGridProps) {
  const items = useGlobeStore(
    (s) => s.mediaByLocation[location.id] ?? EMPTY,
  );

  if (items.length === 0) {
    return <span className="label">NO MEDIA YET — ADD THE FIRST ONE</span>;
  }

  return (
    <div className="grid grid-cols-3 gap-px bg-line">
      {items.map((item) => (
        <MediaTile key={item.id} locationId={location.id} item={item} />
      ))}
    </div>
  );
}
