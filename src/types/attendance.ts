export type AttendanceStatus = "present" | "absent" | "late";

export interface MarkAttendanceEntry {
  pupilId: string;
  status: AttendanceStatus;
}

export interface MarkAttendancePayload {
  classId: string;
  date: string;
  subjectId?: string | null;
  activity?: string | null;
  records: MarkAttendanceEntry[];
}

export interface AttendancePupilSummary {
  id: string;
  fullName: string;
}

export interface AttendanceRecordEntry {
  id: string;
  pupil: AttendancePupilSummary;
  status: AttendanceStatus;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  subjectId: string | null;
  subjectName: string | null;
  activity: string | null;
  date: string;
  records: AttendanceRecordEntry[];
}

export interface ListAttendanceParams {
  classId: string;
  date?: string;
}
