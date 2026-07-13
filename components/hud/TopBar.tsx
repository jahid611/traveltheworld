"use client";

import { useState } from "react";
import SearchBar from "@/components/hud/SearchBar";
import { signOut } from "@/lib/auth";

export interface TopBarProps {
  configured: boolean;
  userEmail: string | null;
}

/** Google-Earth-style top bar: wordmark, search pill, account + logout. */
export default function TopBar({ configured, userEmail }: TopBarProps) {
  void configured; // GlobeApp surfaces the unconfigured notice itself
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      window.location.assign("/login");
    }
  };

  const initial = userEmail?.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-16 items-center gap-4 px-4">
      {/* Brand */}
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(60,64,67,0.35)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" fill="#1a73e8" />
            <path
              d="M3.5 10.5c2 .8 3.4-.6 5-.2s2 2.2 3.6 2.2 2-1.6 3.6-1.6c1 0 1.8.5 2.6 1M4 14.5c1.6.9 2.8-.2 4.2 0 1.7.3 2.2 1.8 3.8 1.8"
              stroke="#fff"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path d="M12 3v18" stroke="#fff" strokeWidth="1" opacity="0.55" />
          </svg>
        </span>
        <span className="hidden text-lg font-medium tracking-tight text-white drop-shadow md:inline">
          Travel the World
        </span>
      </div>

      {/* Search pill */}
      <div className="flex flex-1 justify-center sm:justify-start sm:pl-4">
        <SearchBar />
      </div>

      {/* Account */}
      <div className="ml-auto flex min-w-0 items-center gap-2">
        {userEmail !== null && (
          <>
            <span className="hidden max-w-[12rem] truncate text-sm text-white/80 md:inline">
              {userEmail}
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={signingOut}
              title={`Sign out ${userEmail}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun text-sm font-medium text-white shadow-[0_1px_3px_rgba(60,64,67,0.4)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {signingOut ? "…" : initial}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={signingOut}
              className="hidden rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-medium text-fg shadow-[0_1px_3px_rgba(60,64,67,0.3)] transition-colors hover:bg-white sm:inline-block"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
