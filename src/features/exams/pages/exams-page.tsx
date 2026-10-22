"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

// Mock data — no API wired yet, this is a design pass only.
const CLASS_OPTIONS = [
  { value: "primary-1", label: "Primary 1" },
  { value: "jss-1", label: "JSS 1" },
];

const SUBJECT_OPTIONS = [
  { value: "mathematics", label: "Mathematics" },
  { value: "english", label: "English" },
];

const TERM_OPTIONS = [
  { value: "term-1", label: "Term 1, 2026" },
  { value: "term-2", label: "Term 2, 2026" },
];

const MAX_SCORE = 100;

const PUPIL_SCORES = [
  { id: "1", name: "Amaka Obi", score: "78" },
  { id: "2", name: "Chioma Eze", score: "85" },
  { id: "3", name: "Daniel Afolabi", score: "" },
  { id: "4", name: "Esther Idowu", score: "92" },
  { id: "5", name: "Fatima Lawal", score: "64" },
];

const REPORT_CARD = {
  pupil: "Amaka Obi",
  class: "Primary 1",
  term: "Term 1, 2026",
  subjects: [
    { name: "Mathematics", score: 78, max: 100 },
    { name: "English", score: 85, max: 100 },
    { name: "Basic Science", score: 71, max: 100 },
    { name: "Social Studies", score: 88, max: 100 },
  ],
};

export default function ExamsPage() {
  const [selectedClass, setSelectedClass] = useState("primary-1");
  const [selectedSubject, setSelectedSubject] = useState("mathematics");
  const [selectedTerm, setSelectedTerm] = useState("term-1");
  const [scores, setScores] = useState(() => Object.fromEntries(PUPIL_SCORES.map((p) => [p.id, p.score])));
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);

  const missingCount = Object.values(scores).filter((s) => s === "").length;
  const average = Math.round(
    REPORT_CARD.subjects.reduce((sum, s) => sum + s.score, 0) / REPORT_CARD.subjects.length,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Exams & Report Cards" description="Enter scores per subject, then generate report cards." />

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Dropdown label="Class" options={CLASS_OPTIONS} value={selectedClass} onChange={setSelectedClass} />
          <Dropdown label="Subject" options={SUBJECT_OPTIONS} value={selectedSubject} onChange={setSelectedSubject} />
          <Dropdown label="Term" options={TERM_OPTIONS} value={selectedTerm} onChange={setSelectedTerm} />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Pupil</th>
                <th className="px-5 py-3 font-medium">Score (/ {MAX_SCORE})</th>
              </tr>
            </thead>
            <tbody>
              {PUPIL_SCORES.map((pupil) => (
                <tr key={pupil.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-4 font-medium text-zinc-950">{pupil.name}</td>
                  <td className="px-5 py-4">
                    <input
                      type="number"
                      min={0}
                      max={MAX_SCORE}
                      value={scores[pupil.id]}
                      onChange={(e) => setScores((prev) => ({ ...prev, [pupil.id]: e.target.value }))}
                      placeholder="—"
                      className="h-9 w-20 rounded-lg border border-zinc-300 px-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-4">
          {missingCount > 0 ? (
            <p className="text-xs text-amber-700">{missingCount} score(s) missing</p>
          ) : (
            <p className="text-xs text-zinc-500">All scores entered</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsReportCardOpen(true)}>
              <Eye className="h-4 w-4" />
              Preview report card
            </Button>
            <Button>Submit scores</Button>
          </div>
        </div>
      </section>

      <Modal
        open={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        title={`Report card — ${REPORT_CARD.pupil}`}
        description={`${REPORT_CARD.class} · ${REPORT_CARD.term}`}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-2 font-medium">Subject</th>
              <th className="py-2 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {REPORT_CARD.subjects.map((s) => (
              <tr key={s.name} className="border-b border-zinc-50 last:border-0">
                <td className="py-2.5 text-zinc-700">{s.name}</td>
                <td className="py-2.5 font-medium text-zinc-950">
                  {s.score} / {s.max}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-900">Average</span>
          <Badge variant="blue">{average}%</Badge>
        </div>
      </Modal>
    </div>
  );
}
