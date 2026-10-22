import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { CompleteOnboardingPayload } from "@/types/onboarding";

const LEVEL_LABELS: Record<string, string> = {
  nursery: "Nursery",
  primary: "Primary",
  secondary: "Secondary",
};

const ROLE_LABELS: Record<string, string> = {
  school_admin: "School Admin",
  bursar: "Bursar",
  class_teacher: "Class Teacher",
  subject_teacher: "Subject Teacher",
};

export interface PreviewStepProps {
  organizationName: string;
  data: CompleteOnboardingPayload;
}

export function PreviewStep({ organizationName, data }: PreviewStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">Review &amp; submit</h2>
        <p className="mt-1 text-sm text-zinc-600">Make sure everything looks right before you finish setup.</p>
      </div>

      <section className="rounded-lg border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-950">Contact details</h3>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">Organization</dt>
            <dd className="mt-0.5 text-zinc-700">{organizationName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">Email</dt>
            <dd className="mt-0.5 text-zinc-700">{data.organization.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">Phone</dt>
            <dd className="mt-0.5 text-zinc-700">{data.organization.phone || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-950">Schools ({data.schools.length})</h3>
        <div className="mt-3 flex flex-col gap-4">
          {data.schools.map((school, i) => (
            <dl key={i} className={cn("grid grid-cols-2 gap-3 text-sm", i > 0 && "border-t border-zinc-100 pt-3")}>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">Name</dt>
                <dd className="mt-0.5 text-zinc-700">{school.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">Level</dt>
                <dd className="mt-0.5 text-zinc-700">{LEVEL_LABELS[school.level]}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-wide text-zinc-400">Address</dt>
                <dd className="mt-0.5 text-zinc-700">{school.address || "—"}</dd>
              </div>
            </dl>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-950">Team ({data.staff.length})</h3>
        {data.staff.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No staff invited yet — you can do this later from the Staff page.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {data.staff.map((member, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-zinc-950">{member.fullName}</p>
                  <p className="text-zinc-500">{member.email}</p>
                </div>
                <Badge variant="blue">{ROLE_LABELS[member.role]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
