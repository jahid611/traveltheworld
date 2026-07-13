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
        className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[3px] border-2 border-line-strong bg-white text-white transition-colors peer-checked:border-sun peer-checked:bg-sun peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sun"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[13px] leading-relaxed text-mute group-hover:text-fg">
        {children}
      </span>
    </label>
  );
}
