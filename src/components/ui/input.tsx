"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  /** Error message — shown below the field and flips the border to red. */
  error?: string;
  /** Helper text shown below the field when there's no error. */
  hint?: string;
  /** Shows a spinner in the field and disables it (e.g. while validating or submitting). */
  isLoading?: boolean;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, isLoading, type, className, containerClassName, disabled, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const hasTrailingIcon = isLoading || isPassword;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-900">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled || isLoading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-950 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
              hasTrailingIcon && "pr-10",
              className,
            )}
            {...props}
          />

          {isLoading && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
          )}

          {!isLoading && isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
