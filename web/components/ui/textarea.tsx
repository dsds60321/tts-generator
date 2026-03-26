import { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[220px] w-full rounded-[14px] border border-line bg-panel px-4 py-4 text-sm text-ink outline-none transition-colors duration-150",
        "resize-y placeholder:text-[#94a3b8] hover:border-lineStrong focus:border-accent focus:bg-white focus:ring-2 focus:ring-[rgba(16,32,51,0.08)]",
        "disabled:cursor-not-allowed disabled:border-line disabled:bg-panelMuted disabled:text-subtle",
        className,
      )}
      {...props}
    />
  );
}
