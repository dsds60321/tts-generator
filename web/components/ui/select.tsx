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
        "min-h-[46px] w-full appearance-none rounded-[14px] border border-line bg-panel px-4 py-2.5 pr-10 text-sm text-ink outline-none transition-colors duration-150",
        "hover:border-lineStrong focus:border-accent focus:bg-white focus:ring-2 focus:ring-[rgba(16,32,51,0.08)]",
        "disabled:cursor-not-allowed disabled:border-line disabled:bg-panelMuted disabled:text-subtle",
        "[background-image:linear-gradient(45deg,transparent_50%,#667085_50%),linear-gradient(135deg,#667085_50%,transparent_50%)]",
        "[background-position:calc(100%-18px)_calc(50%-2px),calc(100%-12px)_calc(50%-2px)]",
        "[background-repeat:no-repeat] [background-size:6px_6px]",
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
