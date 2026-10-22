"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { DataTable, DataTableColumnHeader } from "@/components/table";

// Mock data — no API wired yet, this is a design pass only.
const CLASS_OPTIONS = [
  { value: "primary-1", label: "Primary 1" },
  { value: "primary-2", label: "Primary 2" },
  { value: "jss-1", label: "JSS 1" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "guardian", label: "Guardian" },
];

interface Pupil {
  id: string;
  name: string;
  class: string;
  guardian: string;
  guardianPhone: string;
  relationship: string;
  dob: string;
  address: string;
}

const PUPILS: Pupil[] = [
  { id: "1", name: "Amaka Obi", class: "Primary 1", guardian: "Chidinma Obi", guardianPhone: "080 1234 5678", relationship: "Mother", dob: "2018-03-12", address: "14 Allen Avenue, Ikeja" },
  { id: "2", name: "Tunde Bakare", class: "Primary 2", guardian: "Funmi Bakare", guardianPhone: "080 2345 6789", relationship: "Mother", dob: "2017-07-21", address: "22 Opebi Road, Ikeja" },
  { id: "3", name: "Chioma Eze", class: "Primary 1", guardian: "Emeka Eze", guardianPhone: "081 3456 7890", relationship: "Father", dob: "2018-01-05", address: "5 Admiralty Way, Lekki" },
  { id: "4", name: "David Johnson", class: "JSS 1", guardian: "Grace Johnson", guardianPhone: "070 4567 8901", relationship: "Mother", dob: "2013-11-30", address: "9 Herbert Macaulay Way, Yaba" },
  { id: "5", name: "Blessing Nwosu", class: "Primary 2", guardian: "Peter Nwosu", guardianPhone: "090 5678 9012", relationship: "Father", dob: "2017-09-14", address: "31 Awolowo Road, Ikoyi" },
  { id: "6", name: "Fatima Abubakar", class: "JSS 1", guardian: "Zainab Abubakar", guardianPhone: "080 6789 0123", relationship: "Mother", dob: "2013-05-22", address: "17 Bourdillon Road, Ikoyi" },
  { id: "7", name: "Emeka Nnamdi", class: "Primary 1", guardian: "Chukwuemeka Nnamdi", guardianPhone: "081 7890 1234", relationship: "Father", dob: "2018-08-09", address: "3 Marina Road, Lagos Island" },
];

const columns: ColumnDef<Pupil, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.name}</span>,
    meta: { label: "Name" },
  },
  {
    accessorKey: "class",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    meta: { label: "Class" },
  },
  {
    accessorKey: "guardian",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Guardian" />,
    meta: { label: "Guardian" },
  },
  {
    accessorKey: "guardianPhone",
    header: "Guardian phone",
    enableSorting: false,
  },
  {
    accessorKey: "dob",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date of birth" />,
    meta: { label: "Date of birth" },
  },
];

function PupilDetails({ row }: { row: Row<Pupil> }) {
  const pupil = row.original;
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Relationship</dt>
        <dd className="mt-0.5 text-zinc-700">{pupil.relationship}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Address</dt>
        <dd className="mt-0.5 text-zinc-700">{pupil.address}</dd>
      </div>
    </dl>
  );
}

export default function PupilsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [pupilClass, setPupilClass] = useState("primary-1");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [relationship, setRelationship] = useState("mother");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Design only — no API call yet.
    setIsModalOpen(false);
    setFullName("");
    setDob("");
    setGuardianName("");
    setGuardianPhone("");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pupils"
        description="Every pupil enrolled across your schools."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Enroll pupil
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={PUPILS}
        renderSubRow={(row) => <PupilDetails row={row} />}
        searchPlaceholder="Search pupils…"
        emptyTitle="No pupils yet"
        emptyDescription="Enrolled pupils will show up here."
      />

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enroll a pupil" description="Add a new pupil to this school.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Date of birth" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
          <Dropdown label="Class" options={CLASS_OPTIONS} value={pupilClass} onChange={setPupilClass} />

          <div className="h-px bg-zinc-100" />

          <Input label="Guardian name" required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
          <Input label="Guardian phone" required value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
          <Dropdown label="Relationship" options={RELATIONSHIP_OPTIONS} value={relationship} onChange={setRelationship} />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Enroll pupil</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
