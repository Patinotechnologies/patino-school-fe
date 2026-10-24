import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { CreateSubjectPayload, Subject, UpdateSubjectPayload } from "@/types/subject";

const client = createApiClient(apiConfig.baseUrl);

export const subjectsApi = {
  list(schoolId: string) {
    return client.get<Subject[]>(`/subjects?schoolId=${schoolId}`);
  },

  create(payload: CreateSubjectPayload) {
    return client.post<Subject>("/subjects", payload);
  },

  update(id: string, payload: UpdateSubjectPayload) {
    return client.patch<Subject>(`/subjects/${id}`, payload);
  },
};

export function useSubjectsQuery(schoolId: string | null) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.subjects, schoolId],
    queryFn: () => subjectsApi.list(schoolId!),
    enabled: Boolean(token && schoolId),
  });
}

export function useCreateSubjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubjectPayload) => subjectsApi.create(payload),
    onSuccess: (subject) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      toast.success(`${subject.name} added`);
    },
    onError: (err) => toastError(err, "Could not add the subject"),
  });
}

export function useUpdateSubjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubjectPayload }) => subjectsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      toast.success("Subject updated");
    },
    onError: (err) => toastError(err, "Could not update the subject"),
  });
}
