import { Input } from "@/components/ui/input";
import type { CompleteOnboardingPayload } from "@/types/onboarding";

export interface ContactStepProps {
  organizationName: string;
  value: CompleteOnboardingPayload["organization"];
  onChange: (value: CompleteOnboardingPayload["organization"]) => void;
}

export function ContactStep({ organizationName, value, onChange }: ContactStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">Contact details</h2>
        <p className="mt-1 text-sm text-zinc-600">
          How can people reach {organizationName || "your organization"}?
        </p>
      </div>

      <Input
        label="Email"
        type="email"
        value={value.email ?? ""}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
      />
      <Input
        label="Phone"
        value={value.phone ?? ""}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
      />
    </div>
  );
}
