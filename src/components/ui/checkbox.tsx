"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <CheckboxPrimitive.Root
            ref={ref}
            id={checkboxId}
            aria-invalid={Boolean(error)}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-300 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground dark:border-zinc-700 dark:bg-zinc-900",
              error && "border-red-500",
              className,
            )}
            {...props}
          >
            <CheckboxPrimitive.Indicator>
              <Check className="h-3.5 w-3.5 text-background" />
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>

          {label && (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer select-none text-sm text-zinc-900 dark:text-zinc-100"
            >
              {label}
            </label>
          )}
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
