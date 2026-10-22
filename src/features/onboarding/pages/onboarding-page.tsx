"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useMeQuery } from "@/features/auth/api/auth-api";
import { useCompleteOnboardingMutation } from "@/features/onboarding/api/onboarding-api";
import { OnboardingStepper } from "@/features/onboarding/components/onboarding-stepper";
import { ContactStep } from "@/features/onboarding/components/steps/contact-step";
import { SchoolStep } from "@/features/onboarding/components/steps/school-step";
import { TeamStep } from "@/features/onboarding/components/steps/team-step";
import { PreviewStep } from "@/features/onboarding/components/steps/preview-step";
import { Button } from "@/components/ui/button";
import type { CompleteOnboardingPayload } from "@/types/onboarding";

const STEPS = ["Contact", "Schools", "Team", "Preview"];

function getDuplicateEmailError(staff: CompleteOnboardingPayload["staff"]): string | undefined {
  const emails = staff.map((s) => s.email.trim().toLowerCase()).filter(Boolean);
  return new Set(emails).size !== emails.length
    ? "Two staff members have the same email — each must be unique."
    : undefined;
}

export default function OnboardingPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const meQuery = useMeQuery();
  const completeOnboarding = useCompleteOnboardingMutation();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<CompleteOnboardingPayload>({
    organization: { phone: "", email: "" },
    schools: [{ name: "", level: "primary", address: "" }],
    staff: [],
  });

  const isUnauthenticated = hasHydrated && !token;
  const isAlreadyOnboarded = Boolean(meQuery.data?.organization.onboardedAt);

  useEffect(() => {
    if (isUnauthenticated) {
      router.replace("/login");
    } else if (isAlreadyOnboarded) {
      router.replace("/dashboard");
    }
  }, [isUnauthenticated, isAlreadyOnboarded, router]);

  if (!hasHydrated || !token || !meQuery.data || isAlreadyOnboarded) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  const organizationName = meQuery.data.organization.name;
  const duplicateEmailError = getDuplicateEmailError(data.staff);
  const hasIncompleteStaffRow = data.staff.some((s) => !s.fullName.trim() || !s.email.trim());

  const canProceed =
    step === 1
      ? data.schools.every((s) => s.name.trim().length >= 2)
      : step === 2
        ? !duplicateEmailError && !hasIncompleteStaffRow
        : true;

  function handleNext() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    // Blank inputs land in state as "" — the backend treats these fields as optional/nullable,
    // not empty-string, so convert before sending (same rule as Settings' profile/company forms).
    const payload: CompleteOnboardingPayload = {
      organization: {
        phone: data.organization.phone?.trim() || null,
        email: data.organization.email?.trim() || null,
      },
      schools: data.schools.map((school) => ({ ...school, address: school.address?.trim() || null })),
      staff: data.staff.map((member) => ({ ...member, phone: member.phone?.trim() || null })),
    };
    completeOnboarding.mutate(payload, { onSuccess: () => router.push("/dashboard") });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-950">Set up {organizationName}</h1>
        <p className="mt-1 text-sm text-zinc-600">A few quick steps before you get started.</p>

        <div className="mt-6">
          <OnboardingStepper steps={STEPS} currentStep={step} />
        </div>

        <div className="mt-8">
          {step === 0 && (
            <ContactStep
              organizationName={organizationName}
              value={data.organization}
              onChange={(organization) => setData({ ...data, organization })}
            />
          )}
          {step === 1 && (
            <SchoolStep value={data.schools} onChange={(schools) => setData({ ...data, schools })} />
          )}
          {step === 2 && (
            <TeamStep
              value={data.staff}
              onChange={(staff) => setData({ ...data, staff })}
              duplicateEmailError={duplicateEmailError}
            />
          )}
          {step === 3 && <PreviewStep organizationName={organizationName} data={data} />}
        </div>

        <div className="mt-8 flex justify-between border-t border-zinc-100 pt-6">
          <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} disabled={!canProceed}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={completeOnboarding.isPending}
              loadingText="Finishing up…"
            >
              Complete setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
