import { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[];
};

export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors",
        "focus:border-black disabled:bg-[#f5f5f5] disabled:text-[#7d7d7d]",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
