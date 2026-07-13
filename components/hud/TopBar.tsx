"use client";

import { useState } from "react";
import SearchBar from "@/components/hud/SearchBar";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/lib/auth";

export interface TopBarProps {
  configured: boolean;
  userEmail: string | null;
}

/** Fixed brutalist top bar: brand block, geocoding search, user chip + logout. */
export default function TopBar({ configured, userEmail }: TopBarProps) {
  void configured; // reserved — GlobeApp surfaces the unconfigured notice itself
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

  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-14 items-center gap-4 border-b border-line bg-ink/95 px-4">
      {/* Brand */}
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-fg text-xs font-black text-ink">
          TW
        </span>
        <span className="hidden text-sm font-bold tracking-widest uppercase md:inline">
          TRAVELTHEWORLD
        </span>
        <span className="hidden text-mute md:inline">///</span>
      </div>

      {/* Search — hidden on small screens */}
      <div className="hidden flex-1 justify-center sm:flex">
        <SearchBar />
      </div>

      {/* User chip + logout */}
      <div className="ml-auto flex min-w-0 items-center gap-3">
        {userEmail !== null && (
          <>
            <span className="max-w-[14rem] truncate text-xs lowercase text-mute">
              {userEmail}
            </span>
            <Button
              variant="ghost"
              onClick={() => void handleLogout()}
              disabled={signingOut}
            >
              LOGOUT
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
