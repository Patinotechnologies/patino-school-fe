export type StaffRole = "school_admin" | "bursar" | "class_teacher" | "subject_teacher";

export interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  active: boolean;
}

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  role: StaffRole;
}

export interface ListStaffParams {
  search?: string;
  role?: StaffRole;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedStaff {
  data: Staff[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
