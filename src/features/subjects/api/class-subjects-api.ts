import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { AssignClassSubjectPayload, ClassSubject } from "@/types/subject";

const client = createApiClient(apiConfig.baseUrl);

export const classSubjectsApi = {
  list(classId: string) {
    return client.get<ClassSubject[]>(`/class-subjects?classId=${classId}`);
  },

  assign(payload: AssignClassSubjectPayload) {
    return client.post<ClassSubject>("/class-subjects", payload);
  },
};

export function useClassSubjectsQuery(classId: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.classSubjects, classId],
    queryFn: () => classSubjectsApi.list(classId),
    enabled: Boolean(token && classId),
  });
}

export function useAssignClassSubjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignClassSubjectPayload) => classSubjectsApi.assign(payload),
    onSuccess: (classSubject) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.classSubjects, classSubject.classId] });
      toast.success(`${classSubject.subject.name} assigned`);
    },
    onError: (err) => toastError(err, "Could not assign the subject"),
  });
}
