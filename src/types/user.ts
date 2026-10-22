export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string | null;
}
