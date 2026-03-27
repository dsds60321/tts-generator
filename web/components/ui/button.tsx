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
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] border px-5 py-3 text-sm font-semibold tracking-[-0.01em] transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(16,32,51,0.2)] focus-visible:ring-offset-2",
        variant === "primary" &&
          "border-accent bg-accent text-white hover:bg-[#15283d]",
        variant === "secondary" &&
          "border-line bg-white text-ink hover:border-accent hover:bg-panelMuted",
        variant === "ghost" &&
          "border-transparent bg-transparent text-muted hover:bg-panelMuted hover:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    />
  );
}
