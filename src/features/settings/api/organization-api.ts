import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { OrganizationProfile, UpdateOrganizationPayload } from "@/types/organization";

const client = createApiClient(apiConfig.baseUrl);

export const organizationApi = {
  getProfile() {
    return client.get<OrganizationProfile>("/organizations/me");
  },

  updateProfile(payload: UpdateOrganizationPayload) {
    return client.patch<OrganizationProfile>("/organizations/me", payload);
  },
};

export function useOrganizationProfileQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: queryKeys.organizationProfile,
    queryFn: organizationApi.getProfile,
    enabled: Boolean(token),
  });
}

export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) => organizationApi.updateProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData<OrganizationProfile>(queryKeys.organizationProfile, profile);
      toast.success("Company details updated");
    },
    onError: (err) => toastError(err, "Could not update company details"),
  });
}
