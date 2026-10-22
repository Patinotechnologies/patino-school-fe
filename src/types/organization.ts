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
