export type SchoolLevel = "nursery" | "primary" | "secondary";

export interface School {
  id: string;
  name: string;
  level: SchoolLevel;
  address: string | null;
  onboardedAt: string | null;
}

export interface CreateSchoolPayload {
  name: string;
  level: SchoolLevel;
  address?: string | null;
}
