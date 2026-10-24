export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  testMaxScore: number;
  assignmentMaxScore: number;
  examMaxScore: number;
}

export interface CreateSubjectPayload {
  schoolId: string;
  name: string;
  testMaxScore?: number;
  assignmentMaxScore?: number;
  examMaxScore?: number;
}

export interface UpdateSubjectPayload {
  name?: string;
  testMaxScore?: number;
  assignmentMaxScore?: number;
  examMaxScore?: number;
}

export interface SubjectTeacherSummary {
  id: string;
  fullName: string;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subject: Subject;
  subjectTeacher: SubjectTeacherSummary | null;
}

export interface AssignClassSubjectPayload {
  classId: string;
  subjectId: string;
  subjectTeacherId?: string | null;
}
