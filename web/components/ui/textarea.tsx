import { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[220px] w-full rounded-lg border border-line bg-white px-4 py-4 text-sm text-ink outline-none transition-colors",
        "placeholder:text-[#8a8a8a] focus:border-black",
        className,
      )}
      {...props}
    />
  );
}
