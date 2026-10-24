import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { CreateClassPayload, SchoolClass, UpdateClassPayload } from "@/types/class";

const client = createApiClient(apiConfig.baseUrl);

export const classesApi = {
  list(schoolId: string) {
    return client.get<SchoolClass[]>(`/classes?schoolId=${schoolId}`);
  },

  get(id: string) {
    return client.get<SchoolClass>(`/classes/${id}`);
  },

  create(payload: CreateClassPayload) {
    return client.post<SchoolClass>("/classes", payload);
  },

  update(id: string, payload: UpdateClassPayload) {
    return client.patch<SchoolClass>(`/classes/${id}`, payload);
  },
};

export function useClassesQuery(schoolId: string | null) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.classes, schoolId],
    queryFn: () => classesApi.list(schoolId!),
    enabled: Boolean(token && schoolId),
  });
}

export function useClassQuery(id: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.classes, "detail", id],
    queryFn: () => classesApi.get(id),
    enabled: Boolean(token && id),
  });
}

export function useCreateClassMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClassPayload) => classesApi.create(payload),
    onSuccess: (cls) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      toast.success(`${cls.name} added`);
    },
    onError: (err) => toastError(err, "Could not add the class"),
  });
}

export function useUpdateClassMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateClassPayload) => classesApi.update(id, payload),
    onSuccess: (cls) => {
      queryClient.setQueryData([...queryKeys.classes, "detail", id], cls);
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      toast.success("Class updated");
    },
    onError: (err) => toastError(err, "Could not update the class"),
  });
}
