"use client";

import { useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ApiError } from "@/lib/api/api-client";
import { useSchoolStore } from "@/stores/school-store";
import { useClassesQuery } from "@/features/classes/api/classes-api";
import {
  useCreatePupilMutation,
  useDeletePupilMutation,
  useMovePupilsMutation,
  usePupilsQuery,
  useUpdatePupilMutation,
} from "@/features/pupils/api/pupils-api";
import type { GuardianRelationship, Pupil } from "@/types/pupil";

const NO_CLASS_VALUE = "none";

const RELATIONSHIP_OPTIONS: { value: GuardianRelationship; label: string }[] = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "guardian", label: "Guardian" },
];

const columns: ColumnDef<Pupil, unknown>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.fullName}</span>,
    meta: { label: "Name" },
  },
  {
    id: "class",
    accessorFn: (pupil) => pupil.class?.name ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    cell: ({ row }) => row.original.class?.name ?? "Unassigned",
    meta: { label: "Class" },
  },
  {
    accessorKey: "guardianName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Guardian" />,
    meta: { label: "Guardian" },
  },
  {
    accessorKey: "guardianPhone",
    header: "Guardian phone",
    enableSorting: false,
  },
  {
    accessorKey: "dateOfBirth",
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
        <dd className="mt-0.5 capitalize text-zinc-700">{pupil.guardianRelationship}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Address</dt>
        <dd className="mt-0.5 text-zinc-700">{pupil.address ?? "—"}</dd>
      </div>
    </dl>
  );
}

export default function PupilsPage() {
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const pupilsQuery = usePupilsQuery(selectedSchoolId ? { schoolId: selectedSchoolId, pageSize: 100 } : null);
  const classesQuery = useClassesQuery(selectedSchoolId);
  const createPupil = useCreatePupilMutation();
  const deletePupil = useDeletePupilMutation();

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [editingPupil, setEditingPupil] = useState<Pupil | null>(null);
  const [selectedPupils, setSelectedPupils] = useState<Pupil[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [classId, setClassId] = useState(NO_CLASS_VALUE);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [relationship, setRelationship] = useState<GuardianRelationship>("mother");

  const pupils = pupilsQuery.data?.data ?? [];
  const classOptions = [
    { value: NO_CLASS_VALUE, label: "No class" },
    ...(classesQuery.data ?? []).map((cls) => ({ value: cls.id, label: cls.name })),
  ];

  const pupilsError =
    pupilsQuery.error instanceof ApiError
      ? pupilsQuery.error.message
      : pupilsQuery.isError
        ? "Could not load pupils"
        : null;

  function resetForm() {
    setFullName("");
    setDob("");
    setClassId(NO_CLASS_VALUE);
    setGuardianName("");
    setGuardianPhone("");
    setRelationship("mother");
  }

  function handleEnroll(e: FormEvent) {
    e.preventDefault();
    if (!selectedSchoolId) return;
    createPupil.mutate(
      {
        schoolId: selectedSchoolId,
        classId: classId === NO_CLASS_VALUE ? null : classId,
        fullName,
        dateOfBirth: dob,
        guardianName,
        guardianPhone,
        guardianRelationship: relationship,
      },
      { onSuccess: () => { setIsEnrollModalOpen(false); resetForm(); } },
    );
  }

  function handleDelete(pupil: Pupil) {
    if (!window.confirm(`Remove ${pupil.fullName}? This can't be undone.`)) return;
    deletePupil.mutate(pupil.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pupils"
        description="Every pupil enrolled at this school."
        action={
          <div className="flex items-center gap-3">
            {selectedPupils.length > 0 && (
              <Button variant="outline" onClick={() => setIsMoveModalOpen(true)}>
                Move {selectedPupils.length} to class
              </Button>
            )}
            <Button onClick={() => setIsEnrollModalOpen(true)} disabled={!selectedSchoolId}>
              <Plus className="h-4 w-4" />
              Enroll pupil
            </Button>
          </div>
        }
      />

      {pupilsError && <p className="text-sm text-red-600">{pupilsError}</p>}

      <DataTable
        columns={[
          ...columns,
          {
            id: "actions",
            header: "",
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => (
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setEditingPupil(row.original)}
                  aria-label={`Edit ${row.original.fullName}`}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.original)}
                  aria-label={`Remove ${row.original.fullName}`}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
        data={pupils}
        isLoading={pupilsQuery.isPending}
        renderSubRow={(row) => <PupilDetails row={row} />}
        searchPlaceholder="Search pupils…"
        emptyTitle="No pupils yet"
        emptyDescription="Enrolled pupils will show up here."
        enableRowSelection
        getRowId={(pupil) => pupil.id}
        onSelectedRowsChange={setSelectedPupils}
      />

      <Modal open={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} title="Enroll a pupil" description="Add a new pupil to this school.">
        <form onSubmit={handleEnroll} className="flex flex-col gap-4">
          <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Date of birth" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
          <Dropdown label="Class" options={classOptions} value={classId} onChange={setClassId} isLoading={classesQuery.isPending} />

          <div className="h-px bg-zinc-100" />

          <Input label="Guardian name" required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
          <Input label="Guardian phone" required value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
          <Dropdown
            label="Relationship"
            options={RELATIONSHIP_OPTIONS}
            value={relationship}
            onChange={(value) => setRelationship(value as GuardianRelationship)}
          />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createPupil.isPending} loadingText="Enrolling…">
              Enroll pupil
            </Button>
          </div>
        </form>
      </Modal>

      {editingPupil && (
        <EditPupilModal pupil={editingPupil} classOptions={classOptions} classOptionsLoading={classesQuery.isPending} onClose={() => setEditingPupil(null)} />
      )}

      {isMoveModalOpen && (
        <MovePupilsModal
          pupils={selectedPupils}
          classOptions={classOptions}
          classOptionsLoading={classesQuery.isPending}
          onClose={() => setIsMoveModalOpen(false)}
        />
      )}
    </div>
  );
}

function EditPupilModal({
  pupil,
  classOptions,
  classOptionsLoading,
  onClose,
}: {
  pupil: Pupil;
  classOptions: { value: string; label: string }[];
  classOptionsLoading: boolean;
  onClose: () => void;
}) {
  const updatePupil = useUpdatePupilMutation();

  const [fullName, setFullName] = useState(pupil.fullName);
  const [dob, setDob] = useState(pupil.dateOfBirth);
  const [classId, setClassId] = useState(pupil.class?.id ?? NO_CLASS_VALUE);
  const [guardianName, setGuardianName] = useState(pupil.guardianName);
  const [guardianPhone, setGuardianPhone] = useState(pupil.guardianPhone);
  const [relationship, setRelationship] = useState<GuardianRelationship>(pupil.guardianRelationship);
  const [address, setAddress] = useState(pupil.address ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updatePupil.mutate(
      {
        id: pupil.id,
        payload: {
          classId: classId === NO_CLASS_VALUE ? null : classId,
          fullName,
          dateOfBirth: dob,
          guardianName,
          guardianPhone,
          guardianRelationship: relationship,
          address: address.trim() === "" ? null : address,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open onClose={onClose} title="Edit pupil" description={pupil.fullName}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Date of birth" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
        <Dropdown label="Class" options={classOptions} value={classId} onChange={setClassId} isLoading={classOptionsLoading} />

        <div className="h-px bg-zinc-100" />

        <Input label="Guardian name" required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
        <Input label="Guardian phone" required value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
        <Dropdown
          label="Relationship"
          options={RELATIONSHIP_OPTIONS}
          value={relationship}
          onChange={(value) => setRelationship(value as GuardianRelationship)}
        />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updatePupil.isPending} loadingText="Saving…">
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MovePupilsModal({
  pupils,
  classOptions,
  classOptionsLoading,
  onClose,
}: {
  pupils: Pupil[];
  classOptions: { value: string; label: string }[];
  classOptionsLoading: boolean;
  onClose: () => void;
}) {
  const movePupils = useMovePupilsMutation();
  const [classId, setClassId] = useState(NO_CLASS_VALUE);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    movePupils.mutate(
      { pupilIds: pupils.map((p) => p.id), classId: classId === NO_CLASS_VALUE ? null : classId },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Move ${pupils.length} pupil${pupils.length === 1 ? "" : "s"}`}
      description="Choose the class to move them to, or unassign them."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Dropdown label="Class" options={classOptions} value={classId} onChange={setClassId} isLoading={classOptionsLoading} />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={movePupils.isPending} loadingText="Moving…">
            Move
          </Button>
        </div>
      </form>
    </Modal>
  );
}
