export interface ClassTeacherSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  name: string;
  classTeacher: ClassTeacherSummary | null;
}

export interface CreateClassPayload {
  schoolId: string;
  name: string;
  classTeacherId?: string | null;
}

export interface UpdateClassPayload {
  name?: string;
  classTeacherId?: string | null;
}
