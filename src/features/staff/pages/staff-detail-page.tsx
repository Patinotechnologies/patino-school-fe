"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/api-client";
import { useSchoolStore } from "@/stores/school-store";
import { useStaffMemberQuery } from "@/features/staff/api/staff-api";
import { useClassesQuery } from "@/features/classes/api/classes-api";
import { useClassSubjectsByTeacherQuery } from "@/features/subjects/api/class-subjects-api";
import type { StaffRole } from "@/types/staff";

const ROLE_LABELS: Record<StaffRole, string> = {
  school_admin: "School Admin",
  bursar: "Bursar",
  class_teacher: "Class Teacher",
  subject_teacher: "Subject Teacher",
};

const ROLE_BADGE_VARIANT: Record<StaffRole, BadgeProps["variant"]> = {
  school_admin: "blue",
  bursar: "amber",
  class_teacher: "green",
  subject_teacher: "zinc",
};

export function StaffDetailPage({ staffId }: { staffId: string }) {
  const staffQuery = useStaffMemberQuery(staffId);

  const staffError =
    staffQuery.error instanceof ApiError
      ? staffQuery.error.message
      : staffQuery.isError
        ? "Could not load this staff member"
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff" className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-950">
          <ArrowLeft className="h-4 w-4" />
          Back to Staff
        </Link>
      </div>

      {staffQuery.isPending && <p className="text-sm text-zinc-500">Loading staff member…</p>}
      {staffError && <p className="text-sm text-red-600">{staffError}</p>}

      {staffQuery.data && (
        <>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-zinc-950">{staffQuery.data.fullName}</h1>
              <Badge variant={ROLE_BADGE_VARIANT[staffQuery.data.role]}>{ROLE_LABELS[staffQuery.data.role]}</Badge>
              <Badge variant={staffQuery.data.active ? "green" : "zinc"}>{staffQuery.data.active ? "Active" : "Deactivated"}</Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-600">{staffQuery.data.email}</p>
          </div>

          <PersonalDetailsCard staff={staffQuery.data} />
          <ClassesTaughtCard staffId={staffId} />
          <SubjectsTaughtCard staffId={staffId} />
          <AttendanceCard staffName={staffQuery.data.fullName} />
        </>
      )}
    </div>
  );
}

function PersonalDetailsCard({ staff }: { staff: { fullName: string; email: string; phone: string | null; role: StaffRole } }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-zinc-950">Personal details</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Full name</dt>
          <dd className="mt-0.5 text-zinc-900">{staff.fullName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Email</dt>
          <dd className="mt-0.5 text-zinc-900">{staff.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Phone</dt>
          <dd className="mt-0.5 text-zinc-900">{staff.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Role</dt>
          <dd className="mt-0.5 text-zinc-900">{ROLE_LABELS[staff.role]}</dd>
        </div>
      </dl>
    </section>
  );
}

function ClassesTaughtCard({ staffId }: { staffId: string }) {
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const classesQuery = useClassesQuery(selectedSchoolId);

  const classesTaught = (classesQuery.data ?? []).filter((cls) => cls.classTeacher?.id === staffId);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-950">Classes taught</h2>
        <p className="mt-0.5 text-xs text-zinc-500">As class teacher, for the currently selected school.</p>
      </div>

      {classesQuery.isPending && <p className="px-5 py-4 text-sm text-zinc-500">Loading classes…</p>}

      {!classesQuery.isPending && classesTaught.length === 0 && (
        <EmptySection icon={Users} title="Not a class teacher" description="This staff member isn't assigned as a class teacher for this school." bare />
      )}

      {!classesQuery.isPending && classesTaught.length > 0 && (
        <ul className="divide-y divide-zinc-50">
          {classesTaught.map((cls) => (
            <li key={cls.id} className="px-5 py-4 text-sm font-medium text-zinc-950">
              {cls.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SubjectsTaughtCard({ staffId }: { staffId: string }) {
  const classSubjectsQuery = useClassSubjectsByTeacherQuery(staffId);
  const classSubjects = classSubjectsQuery.data ?? [];

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-950">Subjects taught</h2>
        <p className="mt-0.5 text-xs text-zinc-500">As subject teacher, across all classes.</p>
      </div>

      {classSubjectsQuery.isPending && <p className="px-5 py-4 text-sm text-zinc-500">Loading subjects…</p>}

      {!classSubjectsQuery.isPending && classSubjects.length === 0 && (
        <EmptySection icon={BookOpen} title="Not a subject teacher" description="This staff member isn't assigned to teach any subject." bare />
      )}

      {!classSubjectsQuery.isPending && classSubjects.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Weighting</th>
              </tr>
            </thead>
            <tbody>
              {classSubjects.map((cs) => (
                <tr key={cs.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-4 font-medium text-zinc-950">{cs.subject.name}</td>
                  <td className="px-5 py-4 text-zinc-700">{cs.class.name}</td>
                  <td className="px-5 py-4">
                    <Badge variant="zinc">
                      Test {cs.subject.testMaxScore} · Assignment {cs.subject.assignmentMaxScore} · Exam {cs.subject.examMaxScore}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Mock data — the staff attendance module hasn't been built yet, so this renders a placeholder until then.
function AttendanceCard({ staffName }: { staffName: string }) {
  const mockSessions = [
    { date: "2026-10-24", status: "Present" as const },
    { date: "2026-10-23", status: "Present" as const },
    { date: "2026-10-22", status: "Late" as const },
  ];

  const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
    Present: "green",
    Absent: "red",
    Late: "amber",
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Attendance</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{staffName}&apos;s recent attendance.</p>
        </div>
        <Badge variant="amber">Sample data — staff attendance coming soon</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockSessions.map((session) => (
              <tr key={session.date} className="border-b border-zinc-50 last:border-0">
                <td className="px-5 py-4 font-medium text-zinc-950">{session.date}</td>
                <td className="px-5 py-4">
                  <Badge variant={STATUS_VARIANT[session.status]}>{session.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptySection({
  icon: Icon,
  title,
  description,
  bare,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  bare?: boolean;
}) {
  return (
    <section className={bare ? "px-5 py-16 text-center" : "rounded-xl border border-zinc-200 bg-white px-5 py-16 text-center"}>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
        <Icon className="h-5 w-5 text-zinc-400" />
      </div>
      <p className="mt-3 text-sm font-medium text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </section>
  );
}
