"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ApiError } from "@/lib/api/api-client";
import { useCreateStaffMutation, useDeleteStaffMutation, useStaffQuery } from "@/features/staff/api/staff-api";
import type { Staff, StaffRole, StaffStatus } from "@/types/staff";

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "school_admin", label: "School Admin" },
  { value: "bursar", label: "Bursar" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "subject_teacher", label: "Subject Teacher" },
];

const ROLE_FILTER_OPTIONS = [{ value: "all", label: "All roles" }, ...ROLE_OPTIONS];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Deactivated" },
];

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

const STATUS_LABELS: Record<StaffStatus, string> = {
  pending: "Pending",
  active: "Active",
  inactive: "Deactivated",
};

const STATUS_BADGE_VARIANT: Record<StaffStatus, BadgeProps["variant"]> = {
  pending: "amber",
  active: "green",
  inactive: "zinc",
};

function buildColumns(onDelete: (staff: Staff) => void): ColumnDef<Staff, unknown>[] {
  return [
    {
      accessorKey: "fullName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.fullName}</span>,
      meta: { label: "Name" },
    },
    {
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => <Badge variant={ROLE_BADGE_VARIANT[row.original.role]}>{ROLE_LABELS[row.original.role]}</Badge>,
      meta: { label: "Role" },
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      meta: { label: "Email" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => (
        <Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Tooltip content="Delete staff member">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original);
              }}
              aria-label={`Remove ${row.original.fullName}`}
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];
}

export default function StaffPage() {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // DataTable paginates/searches client-side here, so ask the API for everything matching the filters (its max page size) in one go.
  const staffQuery = useStaffQuery({
    pageSize: 100,
    role: roleFilter === "all" ? undefined : roleFilter,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
  });
  const createStaff = useCreateStaffMutation();
  const deleteStaff = useDeleteStaffMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("class_teacher");

  const staffError =
    staffQuery.error instanceof ApiError
      ? staffQuery.error.message
      : staffQuery.isError
        ? "Could not load staff"
        : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createStaff.mutate(
      { fullName, email, phone: phone.trim() === "" ? null : phone, role },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setFullName("");
          setEmail("");
          setPhone("");
          setRole("class_teacher");
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff"
        description="Everyone with access to your schools, and what they can see."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add staff
          </Button>
        }
      />

      {staffError && <p className="text-sm text-red-600">{staffError}</p>}

      <DataTable
        columns={buildColumns(setDeletingStaff)}
        data={staffQuery.data?.data ?? []}
        isLoading={staffQuery.isPending}
        searchPlaceholder="Search staff…"
        emptyTitle="No staff yet"
        emptyDescription="Staff you add will show up here."
        onRowClick={(staff) => router.push(`/staff/${staff.id}`)}
        toolbarFilters={
          <>
            <div className="w-40">
              <Dropdown options={ROLE_FILTER_OPTIONS} value={roleFilter} onChange={(value) => setRoleFilter(value as StaffRole | "all")} />
            </div>
            <div className="w-40">
              <Dropdown
                options={STATUS_FILTER_OPTIONS}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
              />
            </div>
          </>
        }
      />

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a staff member" description="Invite someone to help run your school.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Dropdown label="Role" options={ROLE_OPTIONS} value={role} onChange={(value) => setRole(value as StaffRole)} />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createStaff.isPending} loadingText="Adding…">
              Send invite
            </Button>
          </div>
        </form>
      </Modal>

      {deletingStaff && (
        <DeleteStaffModal
          staff={deletingStaff}
          isDeleting={deleteStaff.isPending}
          onConfirm={() => deleteStaff.mutate(deletingStaff.id, { onSuccess: () => setDeletingStaff(null) })}
          onClose={() => setDeletingStaff(null)}
        />
      )}
    </div>
  );
}

function DeleteStaffModal({
  staff,
  isDeleting,
  onConfirm,
  onClose,
}: {
  staff: Staff;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Remove staff member"
      description={`Remove ${staff.fullName}? This can't be undone from here.`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" isLoading={isDeleting} loadingText="Removing…" onClick={onConfirm}>
            Remove staff member
          </Button>
        </>
      }
    />
  );
}
