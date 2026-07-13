"use client";

import { useGlobeStore } from "@/lib/store";
import { CAMERA_INITIAL_DISTANCE } from "@/lib/constants";

/**
 * Google-Earth-style circular controls, bottom-right. Zoom buttons synthesize
 * wheel events on the WebGL canvas so OrbitControls handles them natively (no
 * coupling to the camera rig); the reset button flies back to a whole-globe view.
 */
export default function ZoomControls() {
  const requestFlyTo = useGlobeStore((s) => s.requestFlyTo);

  const zoom = (deltaY: number) => {
    const canvas = document.querySelector("canvas");
    canvas?.dispatchEvent(
      new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }),
    );
  };

  const resetView = () => {
    const view = useGlobeStore.getState().cameraView;
    requestFlyTo(view?.lat ?? 20, view?.lon ?? 0, CAMERA_INITIAL_DISTANCE);
  };

  return (
    <div className="pointer-events-auto absolute right-4 bottom-16 z-20 flex flex-col items-center gap-2">
      <button
        type="button"
        className="g-control"
        aria-label="Reset view"
        title="Reset view"
        onClick={resetView}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 3v3M12 18v3M3 12h3M18 12h3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div className="flex flex-col overflow-hidden rounded-full shadow-[0_1px_3px_rgba(60,64,67,0.35)]">
        <button
          type="button"
          className="g-control rounded-none shadow-none"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => zoom(-300)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="h-px w-6 self-center bg-line" />
        <button
          type="button"
          className="g-control rounded-none shadow-none"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => zoom(300)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
