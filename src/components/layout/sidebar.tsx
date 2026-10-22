"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useSchoolsQuery, useCreateSchoolMutation } from "@/features/schools/api/schools-api";
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
  const createSchool = useCreateSchoolMutation();
  const selectedSchoolId = useSchoolStore((state) => state.selectedSchoolId);
  const setSelectedSchoolId = useSchoolStore((state) => state.setSelectedSchoolId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<SchoolLevel>("primary");

  const schools = schoolsQuery.data;

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
    setSelectedSchoolId(value);
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
