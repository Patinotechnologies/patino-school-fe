"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Dropdown } from "@/components/ui/dropdown";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import type { AttendanceStatus } from "@/types/attendance";

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

interface StudentAttendanceLogEntry {
  id: string;
  studentName: string;
  className: string;
  context: string;
  date: string;
  status: AttendanceStatus;
}

// Mock data — there is no cross-class attendance-log endpoint yet, so this screen is UI-only for now.
const MOCK_STUDENT_LOG: StudentAttendanceLogEntry[] = [
  { id: "1", studentName: "Loveth John", className: "Primary 1", context: "Whole class", date: "2026-10-24", status: "present" },
  { id: "2", studentName: "Tunde Bakare", className: "Primary 1", context: "Mathematics", date: "2026-10-24", status: "absent" },
  { id: "3", studentName: "Amina Yusuf", className: "Primary 2", context: "Whole class", date: "2026-10-23", status: "late" },
  { id: "4", studentName: "Chidi Okafor", className: "Primary 2", context: "English", date: "2026-10-23", status: "present" },
  { id: "5", studentName: "Ngozi Eze", className: "Primary 3", context: "Sports Day", date: "2026-10-22", status: "present" },
  { id: "6", studentName: "Emeka Nwosu", className: "Primary 1", context: "Mathematics", date: "2026-10-22", status: "present" },
  { id: "7", studentName: "Blessing Adeyemi", className: "Primary 3", context: "Whole class", date: "2026-10-21", status: "absent" },
  { id: "8", studentName: "Ifeoma Chukwu", className: "Primary 2", context: "English", date: "2026-10-21", status: "late" },
];

const CLASS_FILTER_OPTIONS = [
  { value: "all", label: "All classes" },
  ...Array.from(new Set(MOCK_STUDENT_LOG.map((entry) => entry.className))).map((className) => ({
    value: className,
    label: className,
  })),
];

const CONTEXT_FILTER_OPTIONS = [
  { value: "all", label: "All subjects / activities" },
  ...Array.from(new Set(MOCK_STUDENT_LOG.map((entry) => entry.context))).map((context) => ({
    value: context,
    label: context,
  })),
];

const studentColumns: ColumnDef<StudentAttendanceLogEntry, unknown>[] = [
  {
    accessorKey: "studentName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
    cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.studentName}</span>,
    meta: { label: "Student" },
  },
  {
    accessorKey: "className",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    meta: { label: "Class" },
  },
  {
    accessorKey: "context",
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
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>{STATUS_LABEL[row.original.status]}</Badge>,
  },
];

interface StaffAttendanceLogEntry {
  id: string;
  staffName: string;
  role: string;
  date: string;
  status: AttendanceStatus;
}

// Mock data — staff attendance has no backend yet, this tab is UI-only.
const MOCK_STAFF_LOG: StaffAttendanceLogEntry[] = [
  { id: "1", staffName: "Grace Adeyemi", role: "Class Teacher", date: "2026-10-24", status: "present" },
  { id: "2", staffName: "Samuel Okoro", role: "Subject Teacher", date: "2026-10-24", status: "late" },
  { id: "3", staffName: "Ruth Bello", role: "Bursar", date: "2026-10-23", status: "present" },
  { id: "4", staffName: "David Eze", role: "Subject Teacher", date: "2026-10-23", status: "absent" },
  { id: "5", staffName: "Patience Nnamdi", role: "Class Teacher", date: "2026-10-22", status: "present" },
];

const staffColumns: ColumnDef<StaffAttendanceLogEntry, unknown>[] = [
  {
    accessorKey: "staffName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Staff" />,
    cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.staffName}</span>,
    meta: { label: "Staff" },
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    meta: { label: "Role" },
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    meta: { label: "Date" },
  },
  {
    accessorKey: "status",
    header: "Status",
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
  const [classFilter, setClassFilter] = useState("all");
  const [contextFilter, setContextFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const data = useMemo(
    () =>
      MOCK_STUDENT_LOG.filter(
        (entry) =>
          (classFilter === "all" || entry.className === classFilter) &&
          (contextFilter === "all" || entry.context === contextFilter) &&
          (statusFilter === "all" || entry.status === statusFilter),
      ),
    [classFilter, contextFilter, statusFilter],
  );

  return (
    <DataTable
      columns={studentColumns}
      data={data}
      searchPlaceholder="Search by student name…"
      emptyTitle="No attendance records"
      emptyDescription="No records match these filters."
      toolbarFilters={
        <>
          <div className="w-40">
            <Dropdown options={CLASS_FILTER_OPTIONS} value={classFilter} onChange={setClassFilter} />
          </div>
          <div className="w-52">
            <Dropdown options={CONTEXT_FILTER_OPTIONS} value={contextFilter} onChange={setContextFilter} />
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
  const [statusFilter, setStatusFilter] = useState("all");

  const data = useMemo(
    () => MOCK_STAFF_LOG.filter((entry) => statusFilter === "all" || entry.status === statusFilter),
    [statusFilter],
  );

  return (
    <DataTable
      columns={staffColumns}
      data={data}
      searchPlaceholder="Search by staff name…"
      emptyTitle="No attendance records"
      emptyDescription="No records match these filters."
      toolbarFilters={
        <div className="w-40">
          <Dropdown options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        </div>
      }
    />
  );
}
