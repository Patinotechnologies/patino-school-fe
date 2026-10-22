import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface OnboardingStepperProps {
  steps: string[];
  currentStep: number;
}

export function OnboardingStepper({ steps, currentStep }: OnboardingStepperProps) {
  return (
    <ol className="flex items-center">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li key={step} className={cn("flex items-center", index < steps.length - 1 && "flex-1")}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  isComplete && "bg-blue-600 text-white",
                  isCurrent && "border-2 border-blue-600 text-blue-600",
                  !isComplete && !isCurrent && "border-2 border-zinc-200 text-zinc-400",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={cn("hidden text-sm font-medium sm:block", isCurrent ? "text-zinc-950" : "text-zinc-500")}>
                {step}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className={cn("mx-3 h-0.5 flex-1", isComplete ? "bg-blue-600" : "bg-zinc-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
