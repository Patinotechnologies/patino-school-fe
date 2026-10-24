"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ClipboardList, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/api-client";
import { usePupilQuery } from "@/features/pupils/api/pupils-api";
import { useClassQuery } from "@/features/classes/api/classes-api";
import { useClassSubjectsQuery } from "@/features/subjects/api/class-subjects-api";
import type { ClassSubject } from "@/types/subject";

export function PupilDetailPage({ pupilId }: { pupilId: string }) {
  const pupilQuery = usePupilQuery(pupilId);

  const pupilError =
    pupilQuery.error instanceof ApiError
      ? pupilQuery.error.message
      : pupilQuery.isError
        ? "Could not load this pupil"
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/pupils" className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-950">
          <ArrowLeft className="h-4 w-4" />
          Back to Pupils
        </Link>
      </div>

      {pupilQuery.isPending && <p className="text-sm text-zinc-500">Loading pupil…</p>}
      {pupilError && <p className="text-sm text-red-600">{pupilError}</p>}

      {pupilQuery.data && (
        <>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-zinc-950">{pupilQuery.data.fullName}</h1>
              <Badge variant={pupilQuery.data.status === "suspended" ? "amber" : "green"}>
                {pupilQuery.data.status === "suspended" ? "Suspended" : "Active"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-600">{pupilQuery.data.class?.name ?? "Not assigned to a class"}</p>
          </div>

          {pupilQuery.data.status === "suspended" && pupilQuery.data.suspensionReason && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Suspension reason</p>
              <p className="mt-1 text-sm text-amber-900">{pupilQuery.data.suspensionReason}</p>
            </section>
          )}

          <PersonalDetailsCard pupil={pupilQuery.data} />

          {pupilQuery.data.class ? (
            <ClassTeacherAndSubjects classId={pupilQuery.data.class.id} className={pupilQuery.data.class.name} />
          ) : (
            <EmptySection icon={Users} title="Not assigned to a class" description="This pupil has no class, teacher, or subjects to show yet." />
          )}
        </>
      )}
    </div>
  );
}

function PersonalDetailsCard({
  pupil,
}: {
  pupil: { fullName: string; dateOfBirth: string; guardianName: string; guardianPhone: string; guardianRelationship: string; address: string | null };
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-zinc-950">Personal details</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Full name</dt>
          <dd className="mt-0.5 text-zinc-900">{pupil.fullName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Date of birth</dt>
          <dd className="mt-0.5 text-zinc-900">{pupil.dateOfBirth}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Guardian</dt>
          <dd className="mt-0.5 text-zinc-900">{pupil.guardianName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Guardian phone</dt>
          <dd className="mt-0.5 text-zinc-900">{pupil.guardianPhone}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Relationship</dt>
          <dd className="mt-0.5 capitalize text-zinc-900">{pupil.guardianRelationship}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Address</dt>
          <dd className="mt-0.5 text-zinc-900">{pupil.address ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

function ClassTeacherAndSubjects({ classId, className }: { classId: string; className: string }) {
  const classQuery = useClassQuery(classId);
  const classSubjectsQuery = useClassSubjectsQuery(classId);

  const classSubjects = classSubjectsQuery.data ?? [];

  return (
    <>
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-950">Class & teacher</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Class</dt>
            <dd className="mt-0.5 text-zinc-900">{className}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Class teacher</dt>
            <dd className="mt-0.5 text-zinc-900">
              {classQuery.isPending ? "Loading…" : (classQuery.data?.classTeacher?.fullName ?? "Unassigned")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Class teacher email</dt>
            <dd className="mt-0.5 text-zinc-900">{classQuery.data?.classTeacher?.email ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-950">Subjects & subject teachers</h2>
        </div>

        {classSubjectsQuery.isPending && <p className="px-5 py-4 text-sm text-zinc-500">Loading subjects…</p>}

        {!classSubjectsQuery.isPending && classSubjects.length === 0 && (
          <EmptySection icon={BookOpen} title="No subjects yet" description="This class has no subjects assigned yet." bare />
        )}

        {!classSubjectsQuery.isPending && classSubjects.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Subject teacher</th>
                  <th className="px-5 py-3 font-medium">Weighting</th>
                </tr>
              </thead>
              <tbody>
                {classSubjects.map((cs) => (
                  <tr key={cs.id} className="border-b border-zinc-50 last:border-0">
                    <td className="px-5 py-4 font-medium text-zinc-950">{cs.subject.name}</td>
                    <td className="px-5 py-4 text-zinc-700">{cs.subjectTeacher?.fullName ?? "Unassigned"}</td>
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

      {classSubjects.length > 0 && <ScoresCard classSubjects={classSubjects} />}
    </>
  );
}

// Mock scores — the Exams module (ExamScore repository/service/API) hasn't been built yet,
// so this renders a plausible-looking breakdown per subject until that's wired up.
function mockScore(max: number, ratio: number): number {
  return Math.round(max * ratio);
}

function ScoresCard({ classSubjects }: { classSubjects: ClassSubject[] }) {
  const ratios = [0.85, 0.72, 0.9, 0.65, 0.78];

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-950">Scores</h2>
        <Badge variant="amber">Sample data — exams module coming soon</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Test</th>
              <th className="px-5 py-3 font-medium">Assignment</th>
              <th className="px-5 py-3 font-medium">Exam</th>
            </tr>
          </thead>
          <tbody>
            {classSubjects.map((cs, i) => {
              const ratio = ratios[i % ratios.length]!;
              return (
                <tr key={cs.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-4 font-medium text-zinc-950">{cs.subject.name}</td>
                  <td className="px-5 py-4 text-zinc-700">
                    {mockScore(cs.subject.testMaxScore, ratio)} / {cs.subject.testMaxScore}
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {mockScore(cs.subject.assignmentMaxScore, ratio)} / {cs.subject.assignmentMaxScore}
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {mockScore(cs.subject.examMaxScore, ratio)} / {cs.subject.examMaxScore}
                  </td>
                </tr>
              );
            })}
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
  icon: typeof ClipboardList;
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
