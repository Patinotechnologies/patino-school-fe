"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegisterMutation } from "@/features/auth/api/auth-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    registerMutation.mutate(
      { fullName, organizationName, email, password },
      { onSuccess: () => router.push("/onboarding") },
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Register your organization
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create your proprietor account and get started in minutes.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Input
            label="Full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Organization name"
            required
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            autoComplete="organization"
          />
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            hint="At least 8 characters"
          />

          <Button type="submit" className="mt-2 w-full" isLoading={registerMutation.isPending} loadingText="Creating account…">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-950 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
