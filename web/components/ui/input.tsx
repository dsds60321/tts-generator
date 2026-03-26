import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-[46px] w-full rounded-[14px] border border-line bg-panel px-4 py-2.5 text-sm text-ink outline-none transition-colors duration-150",
        "file:mr-4 file:rounded-[10px] file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white",
        "placeholder:text-[#94a3b8] hover:border-lineStrong focus:border-accent focus:bg-white focus:ring-2 focus:ring-[rgba(16,32,51,0.08)]",
        "disabled:cursor-not-allowed disabled:border-line disabled:bg-panelMuted disabled:text-subtle",
        className,
      )}
      {...props}
    />
  );
}
