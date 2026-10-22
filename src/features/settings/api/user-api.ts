import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { MeResponse } from "@/types/auth";
import type { UpdateUserPayload, UserProfile } from "@/types/user";

const client = createApiClient(apiConfig.baseUrl);

export const userApi = {
  getProfile() {
    return client.get<UserProfile>("/users/me");
  },

  updateProfile(payload: UpdateUserPayload) {
    return client.patch<UserProfile>("/users/me", payload);
  },
};

export function useUserProfileQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: userApi.getProfile,
    enabled: Boolean(token),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => userApi.updateProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData<UserProfile>(queryKeys.userProfile, profile);
      // Keep the topbar (driven by the "me" query) in sync without an extra round trip.
      queryClient.setQueryData<MeResponse>(queryKeys.me, (prev) =>
        prev ? { ...prev, user: { id: profile.id, email: profile.email, fullName: profile.fullName } } : prev,
      );
      toast.success("Profile updated");
    },
    onError: (err) => toastError(err, "Could not update your profile"),
  });
}
