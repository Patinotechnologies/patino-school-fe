import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", {
  variants: {
    variant: {
      blue: "bg-blue-50 text-blue-700",
      green: "bg-green-50 text-green-700",
      amber: "bg-amber-50 text-amber-700",
      red: "bg-red-50 text-red-700",
      zinc: "bg-zinc-100 text-zinc-700",
    },
  },
  defaultVariants: {
    variant: "zinc",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
