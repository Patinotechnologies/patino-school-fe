"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";

// Mock data — no API wired yet, this is a design pass only.
const LEVEL_OPTIONS = [
  { value: "nursery", label: "Nursery" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
];

const TEACHER_OPTIONS = [
  { value: "ifeoma", label: "Ifeoma Chukwu" },
  { value: "patricia", label: "Patricia Udo" },
  { value: "mustapha", label: "Mustapha Bello" },
];

const LEVELS = [
  {
    level: "Nursery",
    classes: [{ name: "Nursery 1", teacher: "Grace Adewale", pupils: 24 }],
  },
  {
    level: "Primary",
    classes: [
      { name: "Primary 1", teacher: "Ifeoma Chukwu", pupils: 31 },
      { name: "Primary 2", teacher: "Patricia Udo", pupils: 28 },
    ],
  },
  {
    level: "Secondary",
    classes: [{ name: "JSS 1", teacher: "Mustapha Bello", pupils: 35 }],
  },
];

export default function ClassesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [level, setLevel] = useState("primary");
  const [teacher, setTeacher] = useState("ifeoma");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Design only — no API call yet.
    setIsModalOpen(false);
    setClassName("");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Classes"
        description="Grade structure for this school, and who teaches each class."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add class
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        {LEVELS.map((group) => (
          <section key={group.level} className="rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-zinc-950">{group.level}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-5 py-3 font-medium">Class</th>
                    <th className="px-5 py-3 font-medium">Class teacher</th>
                    <th className="px-5 py-3 font-medium">Pupils</th>
                  </tr>
                </thead>
                <tbody>
                  {group.classes.map((c) => (
                    <tr key={c.name} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                      <td className="px-5 py-4 font-medium text-zinc-950">{c.name}</td>
                      <td className="px-5 py-4 text-zinc-700">{c.teacher}</td>
                      <td className="px-5 py-4 text-zinc-700">{c.pupils}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a class" description="Create a new class and assign a class teacher.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Class name" required placeholder="e.g. Primary 3" value={className} onChange={(e) => setClassName(e.target.value)} />
          <Dropdown label="Level" options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
          <Dropdown label="Class teacher" options={TEACHER_OPTIONS} value={teacher} onChange={setTeacher} />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create class</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
