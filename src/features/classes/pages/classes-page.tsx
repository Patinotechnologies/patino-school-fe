"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserCog, Pencil, Link2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ApiError } from "@/lib/api/api-client";
import { useSchoolStore } from "@/stores/school-store";
import { useClassesQuery, useCreateClassMutation, useUpdateClassMutation } from "@/features/classes/api/classes-api";
import { useStaffQuery } from "@/features/staff/api/staff-api";
import { useCreateSubjectMutation, useSubjectsQuery, useUpdateSubjectMutation } from "@/features/subjects/api/subjects-api";
import { useAssignClassSubjectMutation } from "@/features/subjects/api/class-subjects-api";
import type { SchoolClass } from "@/types/class";
import type { Subject } from "@/types/subject";

const NO_TEACHER_VALUE = "none";

export default function ClassesPage() {
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const [activeTab, setActiveTab] = useState("classes");
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Classes" description="Grade structure for this school, and who teaches each class." />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="subject">Subject</TabsTrigger>
          </TabsList>

          {activeTab === "classes" ? (
            <Button onClick={() => setIsAddClassOpen(true)} disabled={!selectedSchoolId}>
              <Plus className="h-4 w-4" />
              Add class
            </Button>
          ) : (
            <Button onClick={() => setIsAddSubjectOpen(true)} disabled={!selectedSchoolId}>
              <Plus className="h-4 w-4" />
              Add subject
            </Button>
          )}
        </div>

        <TabsContent value="classes" className="pt-6">
          <ClassesTab isAddModalOpen={isAddClassOpen} onCloseAddModal={() => setIsAddClassOpen(false)} />
        </TabsContent>
        <TabsContent value="subject" className="pt-6">
          <SubjectsTab isAddModalOpen={isAddSubjectOpen} onCloseAddModal={() => setIsAddSubjectOpen(false)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClassesTab({ isAddModalOpen, onCloseAddModal }: { isAddModalOpen: boolean; onCloseAddModal: () => void }) {
  const router = useRouter();
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const classesQuery = useClassesQuery(selectedSchoolId);
  const staffQuery = useStaffQuery({ pageSize: 100, active: true });
  const createClass = useCreateClassMutation();

  const [className, setClassName] = useState("");
  const [teacherId, setTeacherId] = useState(NO_TEACHER_VALUE);
  const [assigningClass, setAssigningClass] = useState<SchoolClass | null>(null);

  const classes = classesQuery.data ?? [];
  const teacherOptions = [
    { value: NO_TEACHER_VALUE, label: "No class teacher" },
    ...(staffQuery.data?.data.map((member) => ({ value: member.id, label: member.fullName })) ?? []),
  ];

  const classesError =
    classesQuery.error instanceof ApiError
      ? classesQuery.error.message
      : classesQuery.isError
        ? "Could not load classes"
        : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSchoolId) return;
    createClass.mutate(
      {
        schoolId: selectedSchoolId,
        name: className,
        classTeacherId: teacherId === NO_TEACHER_VALUE ? null : teacherId,
      },
      {
        onSuccess: () => {
          onCloseAddModal();
          setClassName("");
          setTeacherId(NO_TEACHER_VALUE);
        },
      },
    );
  }

  const columns: ColumnDef<SchoolClass, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
      cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.name}</span>,
      meta: { label: "Class" },
    },
    {
      id: "classTeacher",
      accessorFn: (row) => row.classTeacher?.fullName ?? "Unassigned",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class teacher" />,
      meta: { label: "Class teacher" },
    },
    {
      id: "email",
      accessorFn: (row) => row.classTeacher?.email ?? "—",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      meta: { label: "Email" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAssigningClass(row.original);
            }}
            aria-label={`Assign class teacher for ${row.original.name}`}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
          >
            <UserCog className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {classesError && <p className="text-sm text-red-600">{classesError}</p>}

      <DataTable
        columns={columns}
        data={classes}
        isLoading={classesQuery.isPending}
        searchPlaceholder="Search classes…"
        emptyTitle="No classes yet"
        emptyDescription="Add your first one above."
        onRowClick={(cls) => router.push(`/classes/${cls.id}`)}
      />

      <Modal open={isAddModalOpen} onClose={onCloseAddModal} title="Add a class" description="Create a new class and assign a class teacher.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Class name" required placeholder="e.g. Primary 3" value={className} onChange={(e) => setClassName(e.target.value)} />
          <Dropdown
            label="Class teacher"
            options={teacherOptions}
            value={teacherId}
            onChange={setTeacherId}
            isLoading={staffQuery.isPending}
          />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCloseAddModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createClass.isPending} loadingText="Creating…">
              Create class
            </Button>
          </div>
        </form>
      </Modal>

      {assigningClass && (
        <AssignClassTeacherModal
          cls={assigningClass}
          teacherOptions={teacherOptions}
          teacherOptionsLoading={staffQuery.isPending}
          onClose={() => setAssigningClass(null)}
        />
      )}
    </div>
  );
}

function AssignClassTeacherModal({
  cls,
  teacherOptions,
  teacherOptionsLoading,
  onClose,
}: {
  cls: SchoolClass;
  teacherOptions: { value: string; label: string }[];
  teacherOptionsLoading: boolean;
  onClose: () => void;
}) {
  const updateClass = useUpdateClassMutation(cls.id);
  const [teacherId, setTeacherId] = useState(cls.classTeacher?.id ?? NO_TEACHER_VALUE);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateClass.mutate(
      { classTeacherId: teacherId === NO_TEACHER_VALUE ? null : teacherId },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open onClose={onClose} title="Assign class teacher" description={cls.name}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Dropdown
          label="Class teacher"
          options={teacherOptions}
          value={teacherId}
          onChange={setTeacherId}
          isLoading={teacherOptionsLoading}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateClass.isPending} loadingText="Saving…">
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SubjectsTab({ isAddModalOpen, onCloseAddModal }: { isAddModalOpen: boolean; onCloseAddModal: () => void }) {
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const subjectsQuery = useSubjectsQuery(selectedSchoolId);
  const classesQuery = useClassesQuery(selectedSchoolId);
  const staffQuery = useStaffQuery({ pageSize: 100, active: true });
  const createSubject = useCreateSubjectMutation();

  const [name, setName] = useState("");
  const [testMaxScore, setTestMaxScore] = useState("0");
  const [assignmentMaxScore, setAssignmentMaxScore] = useState("0");
  const [examMaxScore, setExamMaxScore] = useState("0");

  const [updatingSubject, setUpdatingSubject] = useState<Subject | null>(null);
  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(null);

  const subjects = subjectsQuery.data ?? [];

  const subjectsError =
    subjectsQuery.error instanceof ApiError
      ? subjectsQuery.error.message
      : subjectsQuery.isError
        ? "Could not load subjects"
        : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSchoolId) return;
    createSubject.mutate(
      {
        schoolId: selectedSchoolId,
        name,
        testMaxScore: Number(testMaxScore) || 0,
        assignmentMaxScore: Number(assignmentMaxScore) || 0,
        examMaxScore: Number(examMaxScore) || 0,
      },
      {
        onSuccess: () => {
          onCloseAddModal();
          setName("");
          setTestMaxScore("0");
          setAssignmentMaxScore("0");
          setExamMaxScore("0");
        },
      },
    );
  }

  const columns: ColumnDef<Subject, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => <span className="font-medium text-zinc-950">{row.original.name}</span>,
      meta: { label: "Subject" },
    },
    {
      accessorKey: "testMaxScore",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Test" />,
      meta: { label: "Test" },
    },
    {
      accessorKey: "assignmentMaxScore",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assignment" />,
      meta: { label: "Assignment" },
    },
    {
      accessorKey: "examMaxScore",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Exam" />,
      meta: { label: "Exam" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setUpdatingSubject(row.original)}
            aria-label={`Update ${row.original.name}`}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAssigningSubject(row.original)}
            aria-label={`Assign ${row.original.name} to a class`}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {subjectsError && <p className="text-sm text-red-600">{subjectsError}</p>}

      <DataTable
        columns={columns}
        data={subjects}
        isLoading={subjectsQuery.isPending}
        searchPlaceholder="Search subjects…"
        emptyTitle="No subjects yet"
        emptyDescription="Add your first one above."
      />

      <Modal
        open={isAddModalOpen}
        onClose={onCloseAddModal}
        title="Add a subject"
        description="Set its name and score weighting (test + assignment + exam)."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Subject name" required placeholder="e.g. Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Test" type="number" min={0} value={testMaxScore} onChange={(e) => setTestMaxScore(e.target.value)} />
            <Input
              label="Assignment"
              type="number"
              min={0}
              value={assignmentMaxScore}
              onChange={(e) => setAssignmentMaxScore(e.target.value)}
            />
            <Input label="Exam" type="number" min={0} value={examMaxScore} onChange={(e) => setExamMaxScore(e.target.value)} />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCloseAddModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSubject.isPending} loadingText="Adding…">
              Add subject
            </Button>
          </div>
        </form>
      </Modal>

      {updatingSubject && <UpdateSubjectModal subject={updatingSubject} onClose={() => setUpdatingSubject(null)} />}

      {assigningSubject && (
        <AssignSubjectModal
          subject={assigningSubject}
          classOptions={(classesQuery.data ?? []).map((cls) => ({ value: cls.id, label: cls.name }))}
          classOptionsLoading={classesQuery.isPending}
          teacherOptions={[
            { value: NO_TEACHER_VALUE, label: "No subject teacher" },
            ...(staffQuery.data?.data.map((member) => ({ value: member.id, label: member.fullName })) ?? []),
          ]}
          teacherOptionsLoading={staffQuery.isPending}
          onClose={() => setAssigningSubject(null)}
        />
      )}
    </div>
  );
}

function UpdateSubjectModal({ subject, onClose }: { subject: Subject; onClose: () => void }) {
  const updateSubject = useUpdateSubjectMutation();

  const [name, setName] = useState(subject.name);
  const [testMaxScore, setTestMaxScore] = useState(String(subject.testMaxScore));
  const [assignmentMaxScore, setAssignmentMaxScore] = useState(String(subject.assignmentMaxScore));
  const [examMaxScore, setExamMaxScore] = useState(String(subject.examMaxScore));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateSubject.mutate(
      {
        id: subject.id,
        payload: {
          name,
          testMaxScore: Number(testMaxScore) || 0,
          assignmentMaxScore: Number(assignmentMaxScore) || 0,
          examMaxScore: Number(examMaxScore) || 0,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open onClose={onClose} title="Update subject" description="Rename it or change its score weighting.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Subject name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Test" type="number" min={0} value={testMaxScore} onChange={(e) => setTestMaxScore(e.target.value)} />
          <Input
            label="Assignment"
            type="number"
            min={0}
            value={assignmentMaxScore}
            onChange={(e) => setAssignmentMaxScore(e.target.value)}
          />
          <Input label="Exam" type="number" min={0} value={examMaxScore} onChange={(e) => setExamMaxScore(e.target.value)} />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateSubject.isPending} loadingText="Saving…">
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AssignSubjectModal({
  subject,
  classOptions,
  classOptionsLoading,
  teacherOptions,
  teacherOptionsLoading,
  onClose,
}: {
  subject: Subject;
  classOptions: { value: string; label: string }[];
  classOptionsLoading: boolean;
  teacherOptions: { value: string; label: string }[];
  teacherOptionsLoading: boolean;
  onClose: () => void;
}) {
  const assignClassSubject = useAssignClassSubjectMutation();
  const [classId, setClassId] = useState(classOptions[0]?.value ?? "");
  const [teacherId, setTeacherId] = useState(NO_TEACHER_VALUE);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!classId) return;
    assignClassSubject.mutate(
      { classId, subjectId: subject.id, subjectTeacherId: teacherId === NO_TEACHER_VALUE ? null : teacherId },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open onClose={onClose} title={`Assign ${subject.name}`} description="Add this subject to a class, with an optional subject teacher.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Dropdown
          label="Class"
          options={classOptions}
          value={classId}
          onChange={setClassId}
          isLoading={classOptionsLoading}
          placeholder="Select a class…"
        />
        <Dropdown
          label="Subject teacher"
          options={teacherOptions}
          value={teacherId}
          onChange={setTeacherId}
          isLoading={teacherOptionsLoading}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={assignClassSubject.isPending} loadingText="Assigning…" disabled={!classId}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  );
}
