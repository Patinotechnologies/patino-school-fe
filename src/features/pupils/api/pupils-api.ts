import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type {
  CreatePupilPayload,
  ListPupilsParams,
  MovePupilsPayload,
  PaginatedPupils,
  Pupil,
  UpdatePupilPayload,
} from "@/types/pupil";

const client = createApiClient(apiConfig.baseUrl);

function toQueryString(params: ListPupilsParams): string {
  const search = new URLSearchParams();
  search.set("schoolId", params.schoolId);
  if (params.classId) search.set("classId", params.classId);
  if (params.search) search.set("search", params.search);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  return `?${search.toString()}`;
}

export const pupilsApi = {
  list(params: ListPupilsParams) {
    return client.get<PaginatedPupils>(`/pupils${toQueryString(params)}`);
  },

  create(payload: CreatePupilPayload) {
    return client.post<Pupil>("/pupils", payload);
  },

  update(id: string, payload: UpdatePupilPayload) {
    return client.patch<Pupil>(`/pupils/${id}`, payload);
  },

  remove(id: string) {
    return client.delete<void>(`/pupils/${id}`);
  },

  move(payload: MovePupilsPayload) {
    return client.post<Pupil[]>("/pupils/move", payload);
  },
};

export function usePupilsQuery(params: ListPupilsParams | null) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.pupils, params],
    queryFn: () => pupilsApi.list(params!),
    enabled: Boolean(token && params?.schoolId),
  });
}

export function useCreatePupilMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePupilPayload) => pupilsApi.create(payload),
    onSuccess: (pupil) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pupils });
      toast.success(`${pupil.fullName} enrolled`);
    },
    onError: (err) => toastError(err, "Could not enroll this pupil"),
  });
}

export function useUpdatePupilMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePupilPayload }) => pupilsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pupils });
      toast.success("Pupil updated");
    },
    onError: (err) => toastError(err, "Could not update this pupil"),
  });
}

export function useDeletePupilMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pupilsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pupils });
      toast.success("Pupil removed");
    },
    onError: (err) => toastError(err, "Could not remove this pupil"),
  });
}

export function useMovePupilsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MovePupilsPayload) => pupilsApi.move(payload),
    onSuccess: (pupils) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pupils });
      toast.success(`${pupils.length} pupil${pupils.length === 1 ? "" : "s"} moved`);
    },
    onError: (err) => toastError(err, "Could not move the selected pupils"),
  });
}
