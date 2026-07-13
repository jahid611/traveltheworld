import { create } from "zustand";
import type { LocationRow, MediaItem } from "@/lib/types";
import { FLY_TO_DISTANCE } from "@/lib/constants";

export interface FlyToTarget {
  lat: number;
  lon: number;
  distance: number;
  /** Monotonic counter so flying to the same coords twice still retriggers the tween. */
  key: number;
}

export interface PendingPin {
  lat: number;
  lon: number;
  suggestedName?: string;
}

interface GlobeStore {
  locations: LocationRow[];
  setLocations: (locations: LocationRow[]) => void;
  upsertLocation: (location: LocationRow) => void;
  removeLocation: (id: string) => void;

  selectedLocationId: string | null;
  selectLocation: (id: string | null) => void;

  flyTo: FlyToTarget | null;
  requestFlyTo: (lat: number, lon: number, distance?: number) => void;

  pendingPin: PendingPin | null;
  setPendingPin: (pin: PendingPin | null) => void;

  mediaByLocation: Record<string, MediaItem[]>;
  setMediaForLocation: (locationId: string, items: MediaItem[]) => void;
  addMediaItem: (locationId: string, item: MediaItem) => void;
  removeMediaItem: (locationId: string, mediaId: string) => void;
}

export const useGlobeStore = create<GlobeStore>()((set) => ({
  locations: [],
  setLocations: (locations) => set({ locations }),
  upsertLocation: (location) =>
    set((state) => {
      const exists = state.locations.some((l) => l.id === location.id);
      return {
        locations: exists
          ? state.locations.map((l) => (l.id === location.id ? location : l))
          : [location, ...state.locations],
      };
    }),
  removeLocation: (id) =>
    set((state) => {
      const mediaByLocation = { ...state.mediaByLocation };
      delete mediaByLocation[id];
      return {
        locations: state.locations.filter((l) => l.id !== id),
        selectedLocationId:
          state.selectedLocationId === id ? null : state.selectedLocationId,
        mediaByLocation,
      };
    }),

  selectedLocationId: null,
  selectLocation: (id) => set({ selectedLocationId: id }),

  flyTo: null,
  requestFlyTo: (lat, lon, distance = FLY_TO_DISTANCE) =>
    set((state) => ({
      flyTo: { lat, lon, distance, key: (state.flyTo?.key ?? 0) + 1 },
    })),

  pendingPin: null,
  setPendingPin: (pin) => set({ pendingPin: pin }),

  mediaByLocation: {},
  setMediaForLocation: (locationId, items) =>
    set((state) => ({
      mediaByLocation: { ...state.mediaByLocation, [locationId]: items },
    })),
  addMediaItem: (locationId, item) =>
    set((state) => ({
      mediaByLocation: {
        ...state.mediaByLocation,
        [locationId]: [item, ...(state.mediaByLocation[locationId] ?? [])],
      },
    })),
  removeMediaItem: (locationId, mediaId) =>
    set((state) => ({
      mediaByLocation: {
        ...state.mediaByLocation,
        [locationId]: (state.mediaByLocation[locationId] ?? []).filter(
          (m) => m.id !== mediaId,
        ),
      },
    })),
}));
