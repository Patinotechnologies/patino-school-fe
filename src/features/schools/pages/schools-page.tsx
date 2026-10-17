"use client";

import { useState, type FormEvent } from "react";
import { useCreateSchoolMutation, useSchoolsQuery } from "@/features/schools/api/schools-api";
import { ApiError } from "@/lib/api/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import type { SchoolLevel } from "@/types/school";

const LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: "nursery", label: "Nursery" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
];

export default function SchoolsPage() {
  const schoolsQuery = useSchoolsQuery();
  const createSchool = useCreateSchoolMutation();

  const [name, setName] = useState("");
  const [level, setLevel] = useState<SchoolLevel>("primary");

  const schools = schoolsQuery.data;
  const listError =
    schoolsQuery.error instanceof ApiError
      ? schoolsQuery.error.message
      : schoolsQuery.isError
        ? "Could not load schools"
        : null;

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    createSchool.mutate(
      { name, level },
      {
        onSuccess: () => {
          setName("");
          setLevel("primary");
        },
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <section>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Schools</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Every school under your organization.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {listError && <p className="text-sm text-red-600 dark:text-red-400">{listError}</p>}
          {schoolsQuery.isPending && <p className="text-sm text-zinc-500">Loading schools…</p>}
          {schools?.length === 0 && (
            <p className="text-sm text-zinc-500">No schools yet — add your first one below.</p>
          )}
          {schools?.map((school) => (
            <div
              key={school.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{school.name}</p>
                <p className="text-xs capitalize text-zinc-500">{school.level}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  school.onboardedAt
                    ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                }`}
              >
                {school.onboardedAt ? "Active" : "Onboarding pending"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Add a school</h2>
        <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end">
          <Input
            label="School name"
            required
            containerClassName="flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Dropdown
            label="Level"
            options={LEVELS}
            value={level}
            onChange={(value) => setLevel(value as SchoolLevel)}
          />

          <Button type="submit" isLoading={createSchool.isPending} loadingText="Adding…">
            Add school
          </Button>
        </form>
      </section>
    </div>
  );
}
