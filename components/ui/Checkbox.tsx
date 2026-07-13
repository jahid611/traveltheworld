"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  children: ReactNode;
}

/** Square, monochrome checkbox — checked state is a full inversion. */
export function Checkbox({ children, className = "", ...props }: CheckboxProps) {
  return (
    <label
      className={`group flex cursor-pointer items-start gap-3 select-none ${className}`.trim()}
    >
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-fg bg-transparent text-[10px] font-bold text-transparent peer-checked:bg-fg peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg"
      >
        X
      </span>
      <span className="text-xs leading-relaxed text-mute group-hover:text-fg">
        {children}
      </span>
    </label>
  );
}
