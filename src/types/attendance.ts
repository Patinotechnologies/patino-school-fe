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

/** One pupil's attendance record, flattened across all classes in a school — for the admin attendance log. */
export interface AttendanceLogEntry {
  pupilId: string;
  pupilName: string;
  classId: string;
  className: string;
  subjectId: string | null;
  subjectName: string | null;
  activity: string | null;
  date: string;
  status: AttendanceStatus;
}

export interface ListAttendanceLogParams {
  schoolId: string;
  classId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAttendanceLog {
  data: AttendanceLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
