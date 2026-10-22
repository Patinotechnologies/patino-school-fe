"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

// Mock data — no API wired yet, this is a design pass only.
const CLASS_OPTIONS = [
  { value: "primary-1", label: "Primary 1" },
  { value: "primary-2", label: "Primary 2" },
  { value: "jss-1", label: "JSS 1" },
];

const ROSTER = [
  { id: "1", name: "Amaka Obi" },
  { id: "2", name: "Chioma Eze" },
  { id: "3", name: "Daniel Afolabi" },
  { id: "4", name: "Esther Idowu" },
  { id: "5", name: "Fatima Lawal" },
];

type Status = "present" | "absent" | "late";

const STATUS_STYLES: Record<Status, string> = {
  present: "bg-green-50 text-green-700 border-green-200",
  absent: "bg-red-50 text-red-700 border-red-200",
  late: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState("primary-1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<string, Status>>(() =>
    Object.fromEntries(ROSTER.map((pupil) => [pupil.id, "present" as Status])),
  );

  const counts = ROSTER.reduce(
    (acc, pupil) => {
      acc[attendance[pupil.id]]++;
      return acc;
    },
    { present: 0, absent: 0, late: 0 } as Record<Status, number>,
  );

  function setStatus(pupilId: string, status: Status) {
    setAttendance((prev) => ({ ...prev, [pupilId]: status }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Attendance" description="Mark today's attendance for your class." />

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Dropdown label="Class" options={CLASS_OPTIONS} value={selectedClass} onChange={setSelectedClass} />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex gap-2 text-sm">
            <span className="rounded-full bg-green-50 px-3 py-1.5 font-medium text-green-700">{counts.present} present</span>
            <span className="rounded-full bg-red-50 px-3 py-1.5 font-medium text-red-700">{counts.absent} absent</span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">{counts.late} late</span>
          </div>
        </div>
      </section>

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
              {ROSTER.map((pupil) => (
                <tr key={pupil.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-4 font-medium text-zinc-950">{pupil.name}</td>
                  <td className="px-5 py-4">
                    <div className="inline-flex rounded-lg border border-zinc-200 p-0.5">
                      {(["present", "absent", "late"] as Status[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatus(pupil.id, status)}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                            attendance[pupil.id] === status
                              ? STATUS_STYLES[status]
                              : "text-zinc-500 hover:bg-zinc-50",
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
          <Button>Submit attendance</Button>
        </div>
      </section>
    </div>
  );
}
