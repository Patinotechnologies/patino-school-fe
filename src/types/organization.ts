export interface OrganizationProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  onboardedAt: string | null;
}

export interface UpdateOrganizationPayload {
  name?: string;
  phone?: string | null;
  email?: string | null;
}

/** Org-wide counts across every school — for the sidebar summary card. */
export interface OrganizationStats {
  totalStaff: number;
  totalPupils: number;
  totalClasses: number;
}
