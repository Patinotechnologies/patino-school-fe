import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthResponse, LoginPayload, MeResponse, RegisterPayload } from "@/types/auth";

const client = createApiClient(apiConfig.baseUrl);

export const authApi = {
  register(payload: RegisterPayload) {
    return client.post<AuthResponse>("/auth/register", payload);
  },

  login(payload: LoginPayload) {
    return client.post<AuthResponse>("/auth/login", payload);
  },

  me() {
    return client.get<MeResponse>("/auth/me");
  },

  logout() {
    return client.post<void>("/auth/logout", {});
  },
};

function useAuthSuccess() {
  const setToken = useAuthStore((state) => state.setToken);
  const queryClient = useQueryClient();

  return (res: AuthResponse) => {
    setToken(res.token);
    // Seed the "me" query directly — avoids an extra round trip right after register/login.
    queryClient.setQueryData(queryKeys.me, { user: res.user, organization: res.organization });
  };
}

export function useRegisterMutation() {
  const onAuthSuccess = useAuthSuccess();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (res) => {
      onAuthSuccess(res);
      toast.success(`Welcome, ${res.user.fullName}! Your organization is ready.`);
    },
    onError: (err) => toastError(err, "Could not create your account"),
  });
}

export function useLoginMutation() {
  const onAuthSuccess = useAuthSuccess();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (res) => {
      onAuthSuccess(res);
      toast.success(`Welcome back, ${res.user.fullName}!`);
    },
    onError: (err) => toastError(err, "Could not log you in"),
  });
}

export function useLogoutMutation() {
  const clearToken = useAuthStore((state) => state.clearToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    // Clear local session regardless of whether the server call succeeds — a network
    // failure here shouldn't be able to trap the user in a logged-in state.
    onSettled: () => {
      clearToken();
      queryClient.clear();
    },
  });
}

export function useMeQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  });
}
