export type GuardianRelationship = "mother" | "father" | "guardian";

export interface PupilClassSummary {
  id: string;
  name: string;
}

export interface Pupil {
  id: string;
  schoolId: string;
  class: PupilClassSummary | null;
  fullName: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: GuardianRelationship;
  address: string | null;
}

export interface CreatePupilPayload {
  schoolId: string;
  classId?: string | null;
  fullName: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: GuardianRelationship;
  address?: string | null;
}

export interface UpdatePupilPayload {
  classId?: string | null;
  fullName?: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: GuardianRelationship;
  address?: string | null;
}

export interface MovePupilsPayload {
  pupilIds: string[];
  classId: string | null;
}

export interface ListPupilsParams {
  schoolId: string;
  classId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPupils {
  data: Pupil[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
