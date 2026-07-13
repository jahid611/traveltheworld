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
      <div className="panel hard-shadow w-full max-w-md border-line-strong">
        <div className="flex items-center justify-between border-b border-line-strong bg-fg px-4 py-2">
          <h2 className="text-xs font-bold tracking-[0.2em] text-ink uppercase">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="border border-ink px-2 py-0.5 text-xs font-bold text-ink hover:bg-ink hover:text-fg"
          >
            X
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
