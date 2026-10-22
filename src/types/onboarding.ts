import type { SchoolLevel, School } from "./school";
import type { OrganizationProfile } from "./organization";
import type { Staff, StaffRole } from "./staff";

export interface OnboardingStaffDraft {
  fullName: string;
  email: string;
  phone?: string | null;
  role: StaffRole;
}

export interface OnboardingSchoolDraft {
  name: string;
  level: SchoolLevel;
  address?: string | null;
}

export interface CompleteOnboardingPayload {
  organization: {
    phone?: string | null;
    email?: string | null;
  };
  schools: OnboardingSchoolDraft[];
  staff: OnboardingStaffDraft[];
}

export interface CompleteOnboardingResponse {
  organization: OrganizationProfile;
  schools: School[];
  staff: Staff[];
}
