import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors",
        "placeholder:text-[#8a8a8a] focus:border-black",
        className,
      )}
      {...props}
    />
  );
}
