"use client";

import { useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/api-client";
import { useUpdateProfileMutation, useUserProfileQuery } from "@/features/settings/api/user-api";
import type { UserProfile } from "@/types/user";

export function ProfileTab() {
  const profileQuery = useUserProfileQuery();
  const profile = profileQuery.data;

  const loadError =
    profileQuery.error instanceof ApiError
      ? profileQuery.error.message
      : profileQuery.isError
        ? "Could not load your profile"
        : null;

  if (profileQuery.isPending) {
    return (
      <div className="max-w-xl rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Loading profile…</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-xl rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-red-600">{loadError ?? "Could not load your profile"}</p>
      </div>
    );
  }

  return <ProfileForm profile={profile} />;
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const updateProfile = useUpdateProfileMutation();

  // Initialized once from the loaded profile — this component only mounts after that data exists.
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateProfile.mutate({ fullName, email, phone: phone.trim() === "" ? null : phone });
  }

  return (
    <div className="max-w-xl rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <button
            type="button"
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white hover:bg-blue-700"
          >
            <Camera className="h-3 w-3" />
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-950">{profile.fullName}</p>
          <Badge variant="blue" className="mt-1 capitalize">
            {profile.role}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-6">
        <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div className="mt-2 flex justify-end">
          <Button type="submit" isLoading={updateProfile.isPending} loadingText="Updating…">
            Update profile
          </Button>
        </div>
      </form>
    </div>
  );
}
