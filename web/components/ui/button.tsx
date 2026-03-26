import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold tracking-[-0.01em] transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(16,32,51,0.18)] focus-visible:ring-offset-2",
        variant === "primary" &&
          "border-accent bg-accent text-white hover:bg-[#15283d]",
        variant === "secondary" &&
          "border-lineStrong bg-panel text-ink hover:border-accent hover:bg-panelMuted",
        variant === "ghost" &&
          "border-transparent bg-transparent text-muted hover:bg-panelMuted hover:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    />
  );
}
