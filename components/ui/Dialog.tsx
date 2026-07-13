"use client";

import { useEffect, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Brutalist modal: dark scrim, hard-shadowed panel, title bar with [X]. */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="panel lift w-full max-w-md overflow-hidden">
        <div className="accent-sun flex items-center justify-between px-4 py-2.5">
          <h2 className="font-display text-sm font-semibold tracking-wide">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-0.5 text-xs font-bold text-[#2a1405] transition-colors hover:bg-[#2a1405]/15"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
