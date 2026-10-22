import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import type { MeResponse } from "@/types/auth";
import type { CompleteOnboardingPayload, CompleteOnboardingResponse } from "@/types/onboarding";

const client = createApiClient(apiConfig.baseUrl);

export const onboardingApi = {
  complete(payload: CompleteOnboardingPayload) {
    return client.post<CompleteOnboardingResponse>("/onboarding/complete", payload);
  },
};

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteOnboardingPayload) => onboardingApi.complete(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.organizationProfile, result.organization);
      // Keep the "me" query (drives the dashboard's onboarding redirect) in sync without a refetch.
      queryClient.setQueryData<MeResponse>(queryKeys.me, (prev) =>
        prev ? { ...prev, organization: { ...prev.organization, onboardedAt: result.organization.onboardedAt } } : prev,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.schools });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      toast.success("Setup complete — welcome aboard!");
    },
    onError: (err) => toastError(err, "Could not complete setup"),
  });
}
