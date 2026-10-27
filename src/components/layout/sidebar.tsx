"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Users,
  UserCog,
  GraduationCap,
  CalendarCheck,
  FileText,
  Wallet,
  Settings,
  Plus,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useSchoolsQuery, useCreateSchoolMutation } from "@/features/schools/api/schools-api";
import { useOrganizationStatsQuery } from "@/features/settings/api/organization-api";
import { useSchoolStore } from "@/stores/school-store";
import type { School, SchoolLevel } from "@/types/school";

const ADD_SCHOOL_VALUE = "__add_school__";

const LEVEL_LABELS: Record<SchoolLevel, string> = {
  nursery: "Nursery",
  primary: "Primary",
  secondary: "Secondary",
};

const LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: "nursery", label: "Nursery" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
];

/** "patino" + primary -> "Patino Primary" — the level keeps otherwise-identical school names distinguishable. */
function formatSchoolLabel(school: School): string {
  const name = school.name.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${name} ${LEVEL_LABELS[school.level]}`;
}

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pupils", href: "/pupils", icon: Users },
  { label: "Staff", href: "/staff", icon: UserCog },
  { label: "Classes", href: "/classes", icon: GraduationCap },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Exams & Report Cards", href: "/exams", icon: FileText },
  { label: "Fees", href: "/fees", icon: Wallet },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const schoolsQuery = useSchoolsQuery();
  const statsQuery = useOrganizationStatsQuery();
  const createSchool = useCreateSchoolMutation();
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const setSelectedSchoolId = useSchoolStore((state) => state.setSelectedSchoolId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<SchoolLevel>("primary");
  const [isSwitchingSchool, setIsSwitchingSchool] = useState(false);

  // Global count of in-flight queries — once it drops back to 0, the newly selected school's
  // data (which every school-scoped query key now includes) has finished loading.
  const isFetching = useIsFetching();

  const schools = schoolsQuery.data;

  useEffect(() => {
    if (!isSwitchingSchool || isFetching > 0) return;
    // Brief debounce: a query triggered by the school change may not have started fetching
    // yet on the same tick, so don't dismiss the instant the count first reads 0.
    const timeout = setTimeout(() => setIsSwitchingSchool(false), 150);
    return () => clearTimeout(timeout);
  }, [isSwitchingSchool, isFetching]);

  useEffect(() => {
    if (!schools || schools.length === 0) return;
    if (!selectedSchoolId || !schools.some((school) => school.id === selectedSchoolId)) {
      setSelectedSchoolId(schools[0].id);
    }
  }, [schools, selectedSchoolId, setSelectedSchoolId]);

  const schoolOptions = [
    ...(schools?.map((school) => ({ value: school.id, label: formatSchoolLabel(school) })) ?? []),
    { value: ADD_SCHOOL_VALUE, label: "+ Add school" },
  ];

  function handleSchoolChange(value: string) {
    if (value === ADD_SCHOOL_VALUE) {
      setIsAddModalOpen(true);
      return;
    }
    if (value === selectedSchoolId) return;

    const school = schools?.find((s) => s.id === value);
    setSelectedSchoolId(value);
    setIsSwitchingSchool(true);
    toast.success(`Switched to ${school ? formatSchoolLabel(school) : "selected school"}`);
  }

  function handleCreateSchool(e: FormEvent) {
    e.preventDefault();
    createSchool.mutate(
      { name, level },
      {
        onSuccess: (school) => {
          setSelectedSchoolId(school.id);
          setIsAddModalOpen(false);
          setName("");
          setLevel("primary");
        },
      },
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
      {isSwitchingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-zinc-900">Switching school…</p>
          </div>
        </div>
      )}

      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-sm font-bold text-white">P</span>
        </div>
        <span className="text-sm font-semibold text-zinc-950">Patino Schools</span>
      </div>

      <div className="border-b border-zinc-200 px-4 py-4">
        <Dropdown
          options={schoolOptions}
          value={selectedSchoolId ?? undefined}
          onChange={handleSchoolChange}
          isLoading={schoolsQuery.isPending}
          placeholder="Select a school…"
        />
        {schoolsQuery.isError && <p className="mt-1.5 text-xs text-red-600">Could not load schools</p>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-zinc-400")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-200 px-4 py-4">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Organization</p>
          <dl className="mt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 text-sm">
              <dt className="flex items-center gap-2 text-zinc-600">
                <UserCog className="h-4 w-4 text-zinc-400" />
                Staff
              </dt>
              <dd className="font-semibold text-zinc-950">{statsQuery.isPending ? "—" : statsQuery.data?.totalStaff}</dd>
            </div>
            <div className="flex items-center justify-between px-1 text-sm">
              <dt className="flex items-center gap-2 text-zinc-600">
                <Users className="h-4 w-4 text-zinc-400" />
                Pupils
              </dt>
              <dd className="font-semibold text-zinc-950">{statsQuery.isPending ? "—" : statsQuery.data?.totalPupils}</dd>
            </div>
            <div className="flex items-center justify-between px-1 text-sm">
              <dt className="flex items-center gap-2 text-zinc-600">
                <GraduationCap className="h-4 w-4 text-zinc-400" />
                Classes
              </dt>
              <dd className="font-semibold text-zinc-950">{statsQuery.isPending ? "—" : statsQuery.data?.totalClasses}</dd>
            </div>
          </dl>
        </div>
      </div>

      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add a school"
        description="It'll show up in the school switcher right away."
      >
        <form onSubmit={handleCreateSchool} className="flex flex-col gap-4">
          <Input label="School name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Dropdown
            label="Level"
            options={LEVELS}
            value={level}
            onChange={(value) => setLevel(value as SchoolLevel)}
          />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSchool.isPending} loadingText="Adding…">
              <Plus className="h-4 w-4" />
              Add school
            </Button>
          </div>
        </form>
      </Modal>
    </aside>
  );
}
