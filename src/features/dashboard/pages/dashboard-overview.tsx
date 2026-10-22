import { Users, CalendarCheck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";

// Mock data — no API wired yet, this is a design pass only.
const SCHOOL_STATS = [
  { name: "Patino Primary", level: "Primary", enrollment: 412, attendanceRate: 94, collectionRate: 81 },
  { name: "Patino Secondary", level: "Secondary", enrollment: 365, attendanceRate: 89, collectionRate: 74 },
  { name: "Patino Nursery", level: "Nursery", enrollment: 118, attendanceRate: 97, collectionRate: 90 },
];

export default function DashboardOverview() {
  const totalEnrollment = SCHOOL_STATS.reduce((sum, s) => sum + s.enrollment, 0);
  const avgAttendance = Math.round(SCHOOL_STATS.reduce((sum, s) => sum + s.attendanceRate, 0) / SCHOOL_STATS.length);
  const avgCollection = Math.round(SCHOOL_STATS.reduce((sum, s) => sum + s.collectionRate, 0) / SCHOOL_STATS.length);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description="Consolidated view across every school in your organization." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total enrollment" value={totalEnrollment.toLocaleString()} icon={Users} hint="Across all schools" />
        <StatCard label="Attendance rate" value={`${avgAttendance}%`} icon={CalendarCheck} hint="Today, org-wide average" />
        <StatCard label="Fee collection rate" value={`${avgCollection}%`} icon={Wallet} hint="This term, org-wide average" />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-950">Schools overview</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">School</th>
                <th className="px-5 py-3 font-medium">Enrollment</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
                <th className="px-5 py-3 font-medium">Collection rate</th>
              </tr>
            </thead>
            <tbody>
              {SCHOOL_STATS.map((school) => (
                <tr key={school.name} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-950">{school.name}</p>
                    <p className="text-xs text-zinc-500">{school.level}</p>
                  </td>
                  <td className="px-5 py-4 text-zinc-700">{school.enrollment}</td>
                  <td className="px-5 py-4">
                    <Badge variant={school.attendanceRate >= 90 ? "green" : "amber"}>{school.attendanceRate}%</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={school.collectionRate >= 80 ? "green" : "amber"}>{school.collectionRate}%</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
