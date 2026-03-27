import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-[rgba(15,23,40,0.05)] bg-panel p-6 shadow-[0_6px_18px_rgba(15,23,40,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
