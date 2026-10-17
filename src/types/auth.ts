export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthenticatedOrganization {
  id: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthenticatedUser;
  organization: AuthenticatedOrganization;
}

export interface MeResponse {
  user: AuthenticatedUser;
  organization: AuthenticatedOrganization;
}

export interface RegisterPayload {
  fullName: string;
  organizationName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
