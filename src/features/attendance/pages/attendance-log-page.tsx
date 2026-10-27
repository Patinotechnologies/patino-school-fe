"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { useSchoolStore } from "@/stores/school-store";
import { useClassesQuery } from "@/features/classes/api/classes-api";
import { useAttendanceLogQuery } from "@/features/attendance/api/attendance-api";
import {
  useStaffAttendanceQuery,
  useStaffAttendanceSettingsQuery,
  useUpdateStaffAttendanceSettingsMutation,
} from "@/features/staff/api/staff-attendance-api";
import type { AttendanceLogEntry, AttendanceStatus } from "@/types/attendance";
import type { StaffAttendanceEntry, StaffAttendanceSettings } from "@/types/staff-attendance";
import type { StaffRole } from "@/types/staff";

const STATUS_BADGE_VARIANT: Record<AttendanceStatus, BadgeProps["variant"]> = {
  present: "green",
  absent: "red",
  late: "amber",
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
];

function entryContext(entry: AttendanceLogEntry): string {
  return entry.subjectName ?? entry.activity ?? "Whole class";
}

const studentColumns: ColumnDef<AttendanceLogEntry, unknown>[] = [
  {
    accessorKey: "pupilName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
    cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.pupilName}</span>,
    meta: { label: "Student" },
  },
  {
    accessorKey: "className",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    meta: { label: "Class" },
  },
  {
    id: "context",
    accessorFn: entryContext,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subject / Activity" />,
    meta: { label: "Subject / Activity" },
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    meta: { label: "Date" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    enableSorting: false,
    cell: ({ row }) => <Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>{STATUS_LABEL[row.original.status]}</Badge>,
  },
];

const ROLE_LABELS: Record<StaffRole, string> = {
  school_admin: "School Admin",
  bursar: "Bursar",
  class_teacher: "Class Teacher",
  subject_teacher: "Subject Teacher",
};

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatCheckInTime(checkInAt: string | null): string {
  if (!checkInAt) return "—";
  return new Date(checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const staffColumns: ColumnDef<StaffAttendanceEntry, unknown>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Staff" />,
    cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.fullName}</span>,
    meta: { label: "Staff" },
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => ROLE_LABELS[row.original.role],
    meta: { label: "Role" },
  },
  {
    accessorKey: "checkInAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Check-in" />,
    cell: ({ row }) => formatCheckInTime(row.original.checkInAt),
    meta: { label: "Check-in" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    enableSorting: false,
    cell: ({ row }) => <Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>{STATUS_LABEL[row.original.status]}</Badge>,
  },
];

export default function AttendanceLogPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/attendance" className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-950">
          <ArrowLeft className="h-4 w-4" />
          Back to Attendance
        </Link>
      </div>

      <PageHeader title="Attendance Log" description="Browse and filter past attendance records." />

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <StudentLogTable />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <StaffLogTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentLogTable() {
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const classesQuery = useClassesQuery(selectedSchoolId);

  const [classFilter, setClassFilter] = useState("all");
  const [contextFilter, setContextFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const logQuery = useAttendanceLogQuery(
    selectedSchoolId
      ? { schoolId: selectedSchoolId, classId: classFilter === "all" ? undefined : classFilter, pageSize: 200 }
      : null,
  );
  const classOptions = [
    { value: "all", label: "All classes" },
    ...(classesQuery.data ?? []).map((cls) => ({ value: cls.id, label: cls.name })),
  ];

  const contextOptions = useMemo(() => {
    const contexts = Array.from(new Set((logQuery.data?.data ?? []).map(entryContext)));
    return [{ value: "all", label: "All subjects / activities" }, ...contexts.map((context) => ({ value: context, label: context }))];
  }, [logQuery.data]);

  const data = useMemo(
    () =>
      (logQuery.data?.data ?? []).filter(
        (entry) => (contextFilter === "all" || entryContext(entry) === contextFilter) && (statusFilter === "all" || entry.status === statusFilter),
      ),
    [logQuery.data, contextFilter, statusFilter],
  );

  return (
    <DataTable
      columns={studentColumns}
      data={data}
      isLoading={logQuery.isPending}
      searchPlaceholder="Search by student name…"
      emptyTitle="No attendance records"
      emptyDescription="No records match these filters."
      toolbarFilters={
        <>
          <div className="w-40">
            <Dropdown options={classOptions} value={classFilter} onChange={setClassFilter} isLoading={classesQuery.isPending} />
          </div>
          <div className="w-52">
            <Dropdown options={contextOptions} value={contextFilter} onChange={setContextFilter} />
          </div>
          <div className="w-40">
            <Dropdown options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          </div>
        </>
      }
    />
  );
}

function StaffLogTable() {
  const [date, setDate] = useState(todayISODate());
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const attendanceQuery = useStaffAttendanceQuery(date);

  const data = useMemo(
    () => (attendanceQuery.data ?? []).filter((entry) => statusFilter === "all" || entry.status === statusFilter),
    [attendanceQuery.data, statusFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setIsRulesModalOpen(true)}>
          <Settings className="h-4 w-4" />
          Set check-in rules
        </Button>
      </div>

      <DataTable
        columns={staffColumns}
        data={data}
        isLoading={attendanceQuery.isPending}
        searchPlaceholder="Search by staff name…"
        emptyTitle="No attendance records"
        emptyDescription="No records match these filters."
        toolbarFilters={
          <>
            <div className="w-44">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="w-40">
              <Dropdown options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
            </div>
          </>
        }
      />

      {isRulesModalOpen && <CheckInRulesModal onClose={() => setIsRulesModalOpen(false)} />}
    </div>
  );
}

function CheckInRulesModal({ onClose }: { onClose: () => void }) {
  const settingsQuery = useStaffAttendanceSettingsQuery();

  return (
    <Modal
      open
      onClose={onClose}
      title="Set check-in rules"
      description="Staff who check in after this time plus the grace period are marked late."
    >
      {settingsQuery.data ? (
        <CheckInRulesForm settings={settingsQuery.data} onClose={onClose} />
      ) : (
        <p className="text-sm text-zinc-500">Loading…</p>
      )}
    </Modal>
  );
}

function CheckInRulesForm({ settings, onClose }: { settings: StaffAttendanceSettings; onClose: () => void }) {
  const updateSettings = useUpdateStaffAttendanceSettingsMutation();

  const [checkInTime, setCheckInTime] = useState(settings.checkInTime);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(String(settings.gracePeriodMinutes));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateSettings.mutate({ checkInTime, gracePeriodMinutes: Number(gracePeriodMinutes) || 0 }, { onSuccess: onClose });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Check-in time" type="time" required value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
      <Input
        label="Grace period (minutes)"
        type="number"
        min={0}
        max={240}
        required
        value={gracePeriodMinutes}
        onChange={(e) => setGracePeriodMinutes(e.target.value)}
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={updateSettings.isPending} loadingText="Saving…">
          Save
        </Button>
      </div>
    </form>
  );
}
