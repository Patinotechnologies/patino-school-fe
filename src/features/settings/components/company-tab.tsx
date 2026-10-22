"use client";

import { useState, type FormEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api/api-client";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { useOrganizationProfileQuery, useUpdateOrganizationMutation } from "@/features/settings/api/organization-api";
import { useStaffQuery } from "@/features/staff/api/staff-api";
import type { OrganizationProfile } from "@/types/organization";
import type { Staff, StaffRole } from "@/types/staff";

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

const columns: ColumnDef<Staff, unknown>[] = [
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
    accessorKey: "active",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "green" : "zinc"}>{row.original.active ? "Active" : "Deactivated"}</Badge>
    ),
  },
];

export function CompanyTab() {
  const organizationQuery = useOrganizationProfileQuery();
  // DataTable paginates client-side here, so ask the API for everything (its max page size) in one go.
  const staffQuery = useStaffQuery({ pageSize: 100 });

  const organization = organizationQuery.data;

  const organizationError =
    organizationQuery.error instanceof ApiError
      ? organizationQuery.error.message
      : organizationQuery.isError
        ? "Could not load company details"
        : null;

  const staffError =
    staffQuery.error instanceof ApiError
      ? staffQuery.error.message
      : staffQuery.isError
        ? "Could not load staff"
        : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-6">
        {organizationQuery.isPending && <p className="text-sm text-zinc-500">Loading company details…</p>}
        {organizationError && <p className="text-sm text-red-600">{organizationError}</p>}
        {organization && (
          <>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                {organization.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950">{organization.name}</p>
                <p className="mt-1 text-sm text-zinc-600">{organization.phone ?? "No phone number set"}</p>
                <p className="text-sm text-zinc-600">{organization.email ?? "No email set"}</p>
              </div>
            </div>
            <UpdatePhoneButton organization={organization} />
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-950">Staff</h2>
        {staffError && <p className="text-sm text-red-600">{staffError}</p>}
        <DataTable
          columns={columns}
          data={staffQuery.data?.data ?? []}
          isLoading={staffQuery.isPending}
          searchPlaceholder="Search staff…"
          emptyTitle="No staff yet"
          emptyDescription="Staff you add will show up here."
        />
      </section>
    </div>
  );
}

function UpdatePhoneButton({ organization }: { organization: OrganizationProfile }) {
  const updateOrganization = useUpdateOrganizationMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phone, setPhone] = useState(organization.phone ?? "");

  function handleOpen() {
    setPhone(organization.phone ?? "");
    setIsModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateOrganization.mutate({ phone: phone.trim() === "" ? null : phone }, { onSuccess: () => setIsModalOpen(false) });
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={handleOpen}>
        Update
      </Button>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update phone number"
        description="This is the phone number staff and guardians can use to reach your organization."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateOrganization.isPending} loadingText="Saving…">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
