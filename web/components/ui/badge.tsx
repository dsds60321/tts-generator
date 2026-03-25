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
        "inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold",
        tone === "default" && "border-line bg-[#f5f5f5] text-ink",
        tone === "success" && "border-black bg-black text-white",
        tone === "warning" && "border-line bg-[#ebebeb] text-ink",
        tone === "danger" && "border-black bg-white text-ink",
        className,
      )}
      {...props}
    />
  );
}
