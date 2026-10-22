import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import type { OnboardingStaffDraft } from "@/types/onboarding";
import type { StaffRole } from "@/types/staff";

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "school_admin", label: "School Admin" },
  { value: "bursar", label: "Bursar" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "subject_teacher", label: "Subject Teacher" },
];

const EMPTY_DRAFT: OnboardingStaffDraft = { fullName: "", email: "", phone: "", role: "class_teacher" };

export interface TeamStepProps {
  value: OnboardingStaffDraft[];
  onChange: (value: OnboardingStaffDraft[]) => void;
  duplicateEmailError?: string;
}

export function TeamStep({ value, onChange, duplicateEmailError }: TeamStepProps) {
  function updateRow(index: number, patch: Partial<OnboardingStaffDraft>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">Invite your team</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Optional — add staff now, or skip and invite them later from the Staff page.
        </p>
      </div>

      {value.map((member, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700">Staff member {index + 1}</p>
            <button
              type="button"
              onClick={() => removeRow(index)}
              aria-label="Remove staff member"
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Input
            label="Full name"
            value={member.fullName}
            onChange={(e) => updateRow(index, { fullName: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={member.email}
            onChange={(e) => updateRow(index, { email: e.target.value })}
          />
          <Input
            label="Phone"
            value={member.phone ?? ""}
            onChange={(e) => updateRow(index, { phone: e.target.value })}
          />
          <Dropdown
            label="Role"
            options={ROLE_OPTIONS}
            value={member.role}
            onChange={(role) => updateRow(index, { role: role as StaffRole })}
          />
        </div>
      ))}

      {duplicateEmailError && <p className="text-sm text-red-600">{duplicateEmailError}</p>}

      {value.length === 0 && <p className="text-sm text-zinc-500">No staff added — you can skip this step.</p>}

      <Button type="button" variant="outline" onClick={() => onChange([...value, { ...EMPTY_DRAFT }])}>
        <Plus className="h-4 w-4" />
        Add staff member
      </Button>
    </div>
  );
}
