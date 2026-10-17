"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth-store";
import { useMeQuery } from "@/features/auth/api/auth-api";
import { ApiError } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const clearToken = useAuthStore((state) => state.clearToken);
  const meQuery = useMeQuery();

  const isUnauthenticated = hasHydrated && !token;
  const isSessionInvalid = meQuery.isError && meQuery.error instanceof ApiError && meQuery.error.status === 401;

  useEffect(() => {
    if (isUnauthenticated) {
      router.replace("/login");
      return;
    }
    if (isSessionInvalid) {
      clearToken();
      queryClient.clear();
      router.replace("/login");
    }
  }, [isUnauthenticated, isSessionInvalid, clearToken, queryClient, router]);

  if (!hasHydrated || !token || !meQuery.data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  const { user, organization } = meQuery.data;

  function handleLogout() {
    clearToken();
    queryClient.clear();
    toast.success("Logged out");
    router.push("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{organization.name}</p>
          <p className="text-xs text-zinc-500">{user.fullName}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
