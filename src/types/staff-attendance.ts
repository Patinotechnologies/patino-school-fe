import type { StaffRole } from "./staff";

export type StaffAttendanceStatus = "present" | "late" | "absent";

export interface StaffAttendanceSettings {
  checkInTime: string;
  gracePeriodMinutes: number;
}

export interface UpdateStaffAttendanceSettingsPayload {
  checkInTime: string;
  gracePeriodMinutes: number;
}

export interface StaffAttendanceEntry {
  staffId: string;
  fullName: string;
  role: StaffRole;
  checkInAt: string | null;
  status: StaffAttendanceStatus;
}
