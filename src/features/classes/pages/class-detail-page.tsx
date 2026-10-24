"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, FileText, type LucideIcon, Users, Wallet, BookOpen, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/api-client";
import { cn } from "@/lib/utils/cn";
import { useClassQuery, useUpdateClassMutation } from "@/features/classes/api/classes-api";
import { useStaffQuery } from "@/features/staff/api/staff-api";
import { useClassSubjectsQuery } from "@/features/subjects/api/class-subjects-api";
import { usePupilsQuery } from "@/features/pupils/api/pupils-api";
import { useAttendanceSessionsQuery, useMarkAttendanceMutation } from "@/features/attendance/api/attendance-api";
import type { SchoolClass } from "@/types/class";
import type { AttendanceStatus } from "@/types/attendance";

const NO_TEACHER_VALUE = "none";

export function ClassDetailPage({ classId }: { classId: string }) {
  const classQuery = useClassQuery(classId);
  const staffQuery = useStaffQuery({ pageSize: 100, active: true });

  const classError =
    classQuery.error instanceof ApiError
      ? classQuery.error.message
      : classQuery.isError
        ? "Could not load this class"
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/classes" className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-950">
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Link>
      </div>

      {classQuery.isPending && <p className="text-sm text-zinc-500">Loading class…</p>}
      {classError && <p className="text-sm text-red-600">{classError}</p>}

      {classQuery.data && (
        <ClassDetailContent
          cls={classQuery.data}
          teacherOptions={[
            { value: NO_TEACHER_VALUE, label: "No class teacher" },
            ...(staffQuery.data?.data.map((member) => ({ value: member.id, label: member.fullName })) ?? []),
          ]}
          teacherOptionsLoading={staffQuery.isPending}
        />
      )}
    </div>
  );
}

function ClassDetailContent({
  cls,
  teacherOptions,
  teacherOptionsLoading,
}: {
  cls: SchoolClass;
  teacherOptions: { value: string; label: string }[];
  teacherOptionsLoading: boolean;
}) {
  const updateClass = useUpdateClassMutation(cls.id);

  // Initialized once from the loaded class — this component only mounts after that data exists.
  const [name, setName] = useState(cls.name);
  const [teacherId, setTeacherId] = useState(cls.classTeacher?.id ?? NO_TEACHER_VALUE);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateClass.mutate({ name, classTeacherId: teacherId === NO_TEACHER_VALUE ? null : teacherId });
  }

  return (
    <>
      <PageHeader title={cls.name} description="Class details and who teaches it." />

      <section className="max-w-xl rounded-xl border border-zinc-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Class name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Dropdown
            label="Class teacher"
            options={teacherOptions}
            value={teacherId}
            onChange={setTeacherId}
            isLoading={teacherOptionsLoading}
          />

          <div className="mt-2 flex justify-end">
            <Button type="submit" isLoading={updateClass.isPending} loadingText="Saving…">
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <Tabs defaultValue="pupils">
        <TabsList>
          <TabsTrigger value="pupils">Pupils</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="pupils" className="pt-6">
          <ClassPupilsTab schoolId={cls.schoolId} classId={cls.id} />
        </TabsContent>
        <TabsContent value="subjects" className="pt-6">
          <ClassSubjectsTab classId={cls.id} />
        </TabsContent>
        <TabsContent value="attendance" className="pt-6">
          <ClassAttendanceTab schoolId={cls.schoolId} classId={cls.id} />
        </TabsContent>
        <TabsContent value="exams" className="pt-6">
          <EmptySection
            icon={FileText}
            title="No exam results yet"
            description="Exam scores and report cards for this class will show up here."
          />
        </TabsContent>
        <TabsContent value="fees" className="pt-6">
          <EmptySection
            icon={Wallet}
            title="No fee records yet"
            description="Fee payments for pupils in this class will show up here."
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ClassSubjectsTab({ classId }: { classId: string }) {
  const classSubjectsQuery = useClassSubjectsQuery(classId);

  const error =
    classSubjectsQuery.error instanceof ApiError
      ? classSubjectsQuery.error.message
      : classSubjectsQuery.isError
        ? "Could not load subjects"
        : null;

  const classSubjects = classSubjectsQuery.data ?? [];

  if (classSubjectsQuery.isPending) {
    return <p className="text-sm text-zinc-500">Loading subjects…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (classSubjects.length === 0) {
    return (
      <EmptySection
        icon={BookOpen}
        title="No subjects yet"
        description="Assign a subject to this class from the Classes page's Subject tab."
      />
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
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
    </section>
  );
}

function ClassPupilsTab({ schoolId, classId }: { schoolId: string; classId: string }) {
  const pupilsQuery = usePupilsQuery({ schoolId, classId, pageSize: 100 });

  const error =
    pupilsQuery.error instanceof ApiError
      ? pupilsQuery.error.message
      : pupilsQuery.isError
        ? "Could not load pupils"
        : null;

  const pupils = pupilsQuery.data?.data ?? [];

  if (pupilsQuery.isPending) {
    return <p className="text-sm text-zinc-500">Loading pupils…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (pupils.length === 0) {
    return (
      <EmptySection
        icon={Users}
        title="No pupils yet"
        description="Move pupils into this class from the Pupils page to see them here."
      />
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Pupil</th>
              <th className="px-5 py-3 font-medium">Guardian</th>
              <th className="px-5 py-3 font-medium">Guardian phone</th>
              <th className="px-5 py-3 font-medium">Date of birth</th>
            </tr>
          </thead>
          <tbody>
            {pupils.map((pupil) => (
              <tr key={pupil.id} className="border-b border-zinc-50 last:border-0">
                <td className="px-5 py-4 font-medium text-zinc-950">{pupil.fullName}</td>
                <td className="px-5 py-4 text-zinc-700">{pupil.guardianName}</td>
                <td className="px-5 py-4 text-zinc-700">{pupil.guardianPhone}</td>
                <td className="px-5 py-4 text-zinc-700">{pupil.dateOfBirth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "late"];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-green-50 text-green-700 border-green-200",
  absent: "bg-red-50 text-red-700 border-red-200",
  late: "bg-amber-50 text-amber-700 border-amber-200",
};

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function ClassAttendanceTab({ schoolId, classId }: { schoolId: string; classId: string }) {
  const sessionsQuery = useAttendanceSessionsQuery({ classId });
  const [isTakeModalOpen, setIsTakeModalOpen] = useState(false);

  const error =
    sessionsQuery.error instanceof ApiError
      ? sessionsQuery.error.message
      : sessionsQuery.isError
        ? "Could not load attendance"
        : null;

  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsTakeModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Take attendance
        </Button>
      </div>

      {sessionsQuery.isPending && <p className="text-sm text-zinc-500">Loading attendance…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!sessionsQuery.isPending && !error && sessions.length === 0 && (
        <EmptySection
          icon={CalendarCheck}
          title="No attendance records yet"
          description="Attendance taken for this class will show up here."
        />
      )}

      {sessions.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white">
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
                  const counts = { present: 0, absent: 0, late: 0 };
                  for (const record of session.records) counts[record.status]++;
                  return (
                    <tr key={session.id} className="border-b border-zinc-50 last:border-0">
                      <td className="px-5 py-4 font-medium text-zinc-950">{session.date}</td>
                      <td className="px-5 py-4 text-zinc-700">
                        {session.subjectName ?? session.activity ?? "Whole class"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="green">{counts.present}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="red">{counts.absent}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="amber">{counts.late}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isTakeModalOpen && (
        <TakeAttendanceModal schoolId={schoolId} classId={classId} onClose={() => setIsTakeModalOpen(false)} />
      )}
    </div>
  );
}

function TakeAttendanceModal({
  schoolId,
  classId,
  onClose,
}: {
  schoolId: string;
  classId: string;
  onClose: () => void;
}) {
  const pupilsQuery = usePupilsQuery({ schoolId, classId, pageSize: 100 });
  const classSubjectsQuery = useClassSubjectsQuery(classId);
  const markAttendance = useMarkAttendanceMutation();

  const [date, setDate] = useState(todayISODate());
  const [context, setContext] = useState<"class" | "subject" | "activity">("class");
  const [subjectId, setSubjectId] = useState("");
  const [activity, setActivity] = useState("");
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const pupils = pupilsQuery.data?.data ?? [];
  const subjectOptions = (classSubjectsQuery.data ?? []).map((cs) => ({ value: cs.subject.id, label: cs.subject.name }));

  function statusFor(pupilId: string): AttendanceStatus {
    return statuses[pupilId] ?? "present";
  }

  function setStatus(pupilId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [pupilId]: status }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pupils.length === 0) return;
    markAttendance.mutate(
      {
        classId,
        date,
        subjectId: context === "subject" ? subjectId || null : null,
        activity: context === "activity" ? activity.trim() || null : null,
        records: pupils.map((pupil) => ({ pupilId: pupil.id, status: statusFor(pupil.id) })),
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open onClose={onClose} title="Take attendance" description="Pick what this attendance is for, then mark each pupil.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Input
            label="Activity"
            placeholder="e.g. Sports Day"
            required
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
        )}

        <div className="h-px bg-zinc-100" />

        {pupilsQuery.isPending && <p className="text-sm text-zinc-500">Loading roster…</p>}
        {!pupilsQuery.isPending && pupils.length === 0 && (
          <p className="text-sm text-zinc-500">No pupils in this class yet.</p>
        )}

        {pupils.length > 0 && (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {pupils.map((pupil) => (
              <div key={pupil.id} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-900">{pupil.fullName}</span>
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
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={markAttendance.isPending}
            loadingText="Saving…"
            disabled={pupils.length === 0 || (context === "subject" && !subjectId) || (context === "activity" && !activity.trim())}
          >
            Save attendance
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EmptySection({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white px-5 py-16 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
        <Icon className="h-5 w-5 text-zinc-400" />
      </div>
      <p className="mt-3 text-sm font-medium text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </section>
  );
}
