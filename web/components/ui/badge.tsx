import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "danger";
};

export function Badge({
  className,
  tone = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em]",
        tone === "default" && "border-line bg-panelMuted text-ink",
        tone === "success" && "border-[rgba(6,118,71,0.18)] bg-successSoft text-success",
        tone === "warning" && "border-[rgba(181,71,8,0.18)] bg-warningSoft text-warning",
        tone === "danger" && "border-[rgba(180,35,24,0.18)] bg-dangerSoft text-danger",
        className,
      )}
      {...props}
    />
  );
}
