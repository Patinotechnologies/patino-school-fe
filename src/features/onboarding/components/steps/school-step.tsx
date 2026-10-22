import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import type { OnboardingSchoolDraft } from "@/types/onboarding";
import type { SchoolLevel } from "@/types/school";

const LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: "nursery", label: "Nursery" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
];

const EMPTY_DRAFT: OnboardingSchoolDraft = { name: "", level: "primary", address: "" };

export interface SchoolStepProps {
  value: OnboardingSchoolDraft[];
  onChange: (value: OnboardingSchoolDraft[]) => void;
}

export function SchoolStep({ value, onChange }: SchoolStepProps) {
  function updateRow(index: number, patch: Partial<OnboardingSchoolDraft>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">Your schools</h2>
        <p className="mt-1 text-sm text-zinc-600">Add at least one school — you can always add more later.</p>
      </div>

      {value.map((school, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700">School {index + 1}</p>
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label="Remove school"
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <Input
            label="School name"
            required
            value={school.name}
            onChange={(e) => updateRow(index, { name: e.target.value })}
          />
          <Dropdown
            label="Level"
            options={LEVELS}
            value={school.level}
            onChange={(level) => updateRow(index, { level: level as SchoolLevel })}
          />
          <Input
            label="Address"
            value={school.address ?? ""}
            onChange={(e) => updateRow(index, { address: e.target.value })}
          />
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => onChange([...value, { ...EMPTY_DRAFT }])}>
        <Plus className="h-4 w-4" />
        Add school
      </Button>
    </div>
  );
}
