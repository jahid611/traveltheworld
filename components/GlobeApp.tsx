"use client";

import { useEffect, useState } from "react";
import { useGlobeStore } from "@/lib/store";
import { listLocations } from "@/lib/data/locations";
import GlobeScene from "@/components/globe/GlobeScene";
import TopBar from "@/components/hud/TopBar";
import ZoomControls from "@/components/hud/ZoomControls";
import CoordReadout from "@/components/hud/CoordReadout";
import LocationPanel from "@/components/panels/LocationPanel";
import AddLocationDialog from "@/components/panels/AddLocationDialog";

export interface GlobeAppProps {
  configured: boolean;
  userEmail: string | null;
}

/**
 * Client orchestrator: bootstraps the user's pins into the store and lays
 * out the HUD around the fullscreen canvas. All Supabase I/O stays in
 * lib/data/*; children read and write the Zustand store.
 */
export default function GlobeApp({ configured, userEmail }: GlobeAppProps) {
  const setLocations = useGlobeStore((s) => s.setLocations);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    listLocations()
      .then((rows) => {
        if (!cancelled) setLocations(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setBootError(
            err instanceof Error ? err.message : "FAILED TO LOAD LOCATIONS",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [configured, setLocations]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0b0e14]">
      <GlobeScene />

      <TopBar configured={configured} userEmail={userEmail} />

      <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center gap-2 px-4">
        {!configured && (
          <p className="notice-block pointer-events-auto max-w-xl text-center shadow-lg">
            Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL /
            NEXT_PUBLIC_SUPABASE_ANON_KEY. Running in view-only mode.
          </p>
        )}
        {bootError && (
          <p className="error-block pointer-events-auto shadow-lg">{bootError}</p>
        )}
      </div>

      <LocationPanel />
      <AddLocationDialog />

      <ZoomControls />
      <CoordReadout />

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden sm:block">
        <span className="g-readout">Drag to rotate · scroll to zoom · click to pin</span>
      </div>
    </main>
  );
}
