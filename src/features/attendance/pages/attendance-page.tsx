"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/api/api-client";
import { useSchoolStore } from "@/stores/school-store";
import { useClassesQuery } from "@/features/classes/api/classes-api";
import { useClassSubjectsQuery } from "@/features/subjects/api/class-subjects-api";
import { usePupilsQuery } from "@/features/pupils/api/pupils-api";
import { useAttendanceSessionsQuery, useMarkAttendanceMutation } from "@/features/attendance/api/attendance-api";
import type { AttendanceStatus } from "@/types/attendance";

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "late"];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-green-50 text-green-700 border-green-200",
  absent: "bg-red-50 text-red-700 border-red-200",
  late: "bg-amber-50 text-amber-700 border-amber-200",
};

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const classesQuery = useClassesQuery(selectedSchoolId);

  const [selectedClassId, setSelectedClassId] = useState("");
  const classOptions = (classesQuery.data ?? []).map((cls) => ({ value: cls.id, label: cls.name }));
  // Default to the first class once the list loads, without clobbering a selection the user already made.
  const classId = selectedClassId || classOptions[0]?.value || "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Attendance" description="Mark attendance for a class, a subject period, or an activity." />

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <Dropdown
          label="Class"
          options={classOptions}
          value={classId}
          onChange={setSelectedClassId}
          isLoading={classesQuery.isPending}
          placeholder="Select a class…"
        />
      </section>

      {classId && <ClassAttendanceForm key={classId} schoolId={selectedSchoolId!} classId={classId} />}
    </div>
  );
}

function ClassAttendanceForm({ schoolId, classId }: { schoolId: string; classId: string }) {
  const pupilsQuery = usePupilsQuery({ schoolId, classId, pageSize: 100 });
  const classSubjectsQuery = useClassSubjectsQuery(classId);
  const sessionsQuery = useAttendanceSessionsQuery({ classId });
  const markAttendance = useMarkAttendanceMutation();

  const [date, setDate] = useState(todayISODate());
  const [context, setContext] = useState<"class" | "subject" | "activity">("class");
  const [subjectId, setSubjectId] = useState("");
  const [activity, setActivity] = useState("");
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const pupils = pupilsQuery.data?.data ?? [];
  const subjectOptions = (classSubjectsQuery.data ?? []).map((cs) => ({ value: cs.subject.id, label: cs.subject.name }));
  const sessions = sessionsQuery.data ?? [];

  const pupilsError =
    pupilsQuery.error instanceof ApiError
      ? pupilsQuery.error.message
      : pupilsQuery.isError
        ? "Could not load pupils"
        : null;

  function statusFor(pupilId: string): AttendanceStatus {
    return statuses[pupilId] ?? "present";
  }

  function setStatus(pupilId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [pupilId]: status }));
  }

  const counts = { present: 0, absent: 0, late: 0 };
  for (const pupil of pupils) counts[statusFor(pupil.id)]++;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pupils.length === 0) return;
    markAttendance.mutate({
      classId,
      date,
      subjectId: context === "subject" ? subjectId || null : null,
      activity: context === "activity" ? activity.trim() || null : null,
      records: pupils.map((pupil) => ({ pupilId: pupil.id, status: statusFor(pupil.id) })),
    });
  }

  return (
    <>
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          <Dropdown
            label="For"
            options={[
              { value: "class", label: "Whole class" },
              { value: "subject", label: "Subject period" },
              { value: "activity", label: "Extra activity" },
            ]}
            value={context}
            onChange={(value) => setContext(value as "class" | "subject" | "activity")}
          />
          {context === "subject" && (
            <Dropdown
              label="Subject"
              options={subjectOptions}
              value={subjectId}
              onChange={setSubjectId}
              isLoading={classSubjectsQuery.isPending}
              placeholder="Select a subject…"
            />
          )}
          {context === "activity" && (
            <Input label="Activity" placeholder="e.g. Sports Day" required value={activity} onChange={(e) => setActivity(e.target.value)} />
          )}
        </div>

        <div className="mt-4 flex gap-2 text-sm">
          <span className="rounded-full bg-green-50 px-3 py-1.5 font-medium text-green-700">{counts.present} present</span>
          <span className="rounded-full bg-red-50 px-3 py-1.5 font-medium text-red-700">{counts.absent} absent</span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">{counts.late} late</span>
        </div>
      </section>

      {pupilsError && <p className="text-sm text-red-600">{pupilsError}</p>}

      <form onSubmit={handleSubmit}>
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Pupil</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pupilsQuery.isPending && (
                  <tr>
                    <td className="px-5 py-4 text-sm text-zinc-500" colSpan={2}>
                      Loading roster…
                    </td>
                  </tr>
                )}
                {!pupilsQuery.isPending && pupils.length === 0 && !pupilsError && (
                  <tr>
                    <td className="px-5 py-4 text-sm text-zinc-500" colSpan={2}>
                      No pupils in this class yet.
                    </td>
                  </tr>
                )}
                {pupils.map((pupil) => (
                  <tr key={pupil.id} className="border-b border-zinc-50 last:border-0">
                    <td className="px-5 py-4 font-medium text-zinc-950">{pupil.fullName}</td>
                    <td className="px-5 py-4">
                      <div className="inline-flex rounded-lg border border-zinc-200 p-0.5">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setStatus(pupil.id, status)}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                              statusFor(pupil.id) === status ? STATUS_STYLES[status] : "text-zinc-500 hover:bg-zinc-50",
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t border-zinc-100 px-5 py-4">
            <Button
              type="submit"
              isLoading={markAttendance.isPending}
              loadingText="Saving…"
              disabled={pupils.length === 0 || (context === "subject" && !subjectId) || (context === "activity" && !activity.trim())}
            >
              Submit attendance
            </Button>
          </div>
        </section>
      </form>

      {sessions.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-950">Recent sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Context</th>
                  <th className="px-5 py-3 font-medium">Present</th>
                  <th className="px-5 py-3 font-medium">Absent</th>
                  <th className="px-5 py-3 font-medium">Late</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const sessionCounts = { present: 0, absent: 0, late: 0 };
                  for (const record of session.records) sessionCounts[record.status]++;
                  return (
                    <tr key={session.id} className="border-b border-zinc-50 last:border-0">
                      <td className="px-5 py-4 font-medium text-zinc-950">{session.date}</td>
                      <td className="px-5 py-4 text-zinc-700">{session.subjectName ?? session.activity ?? "Whole class"}</td>
                      <td className="px-5 py-4">
                        <Badge variant="green">{sessionCounts.present}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="red">{sessionCounts.absent}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="amber">{sessionCounts.late}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
