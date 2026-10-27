"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLogoutMutation, useMeQuery } from "@/features/auth/api/auth-api";
import { ApiError } from "@/lib/api/api-client";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const clearToken = useAuthStore((state) => state.clearToken);
  const meQuery = useMeQuery();
  const logoutMutation = useLogoutMutation();

  const isUnauthenticated = hasHydrated && !token;
  const isSessionInvalid = meQuery.isError && meQuery.error instanceof ApiError && meQuery.error.status === 401;
  const needsOnboarding = Boolean(meQuery.data) && !meQuery.data?.organization.onboardedAt;

  useEffect(() => {
    if (isUnauthenticated) {
      router.replace("/login");
      return;
    }
    if (isSessionInvalid) {
      clearToken();
      queryClient.clear();
      router.replace("/login");
      return;
    }
    if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [isUnauthenticated, isSessionInvalid, needsOnboarding, clearToken, queryClient, router]);

  if (!hasHydrated || !token || !meQuery.data || needsOnboarding) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  const { user, organization } = meQuery.data;

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        toast.success("Logged out");
        router.push("/login");
      },
    });
  }

  return (
    <div className="flex flex-1 bg-zinc-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
          <p className="text-sm font-semibold text-zinc-950">{organization.name}</p>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            {user.fullName}
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
