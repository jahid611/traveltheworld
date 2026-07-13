import type { ButtonHTMLAttributes } from "react";

type Variant = "solid" | "invert" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  solid: "btn",
  invert: "btn btn-invert",
  ghost: "btn btn-ghost",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "solid",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
