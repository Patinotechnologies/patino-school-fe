import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { CreateSchoolPayload, School } from "@/types/school";

const client = createApiClient(apiConfig.baseUrl);

export const schoolsApi = {
  list() {
    return client.get<School[]>("/schools");
  },

  create(payload: CreateSchoolPayload) {
    return client.post<School>("/schools", payload);
  },
};

export function useSchoolsQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: queryKeys.schools,
    queryFn: schoolsApi.list,
    enabled: Boolean(token),
  });
}

export function useCreateSchoolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSchoolPayload) => schoolsApi.create(payload),
    onSuccess: (school) => {
      queryClient.setQueryData<School[]>(queryKeys.schools, (prev) => (prev ? [...prev, school] : [school]));
      toast.success(`${school.name} added`);
    },
    onError: (err) => toastError(err, "Could not add the school"),
  });
}
