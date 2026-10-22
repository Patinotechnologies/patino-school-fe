"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** Shows a spinner in the trigger and disables it (e.g. while options are loading). */
  isLoading?: boolean;
  disabled?: boolean;
  name?: string;
}

export function Dropdown({
  label,
  error,
  hint,
  placeholder = "Select…",
  options,
  value,
  onChange,
  isLoading,
  disabled,
  name,
}: DropdownProps) {
  const triggerId = React.useId();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={triggerId} className="text-sm font-medium text-zinc-900">
          {label}
        </label>
      )}

      <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled || isLoading} name={name}>
        <SelectPrimitive.Trigger
          id={triggerId}
          aria-invalid={Boolean(error)}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm text-zinc-950 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
          ) : (
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
            </SelectPrimitive.Icon>
          )}
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-md"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 pr-8 text-sm text-zinc-950 outline-none data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <Check className="h-4 w-4 text-blue-600" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
