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
  SuspendPupilPayload,
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

  get(id: string) {
    return client.get<Pupil>(`/pupils/${id}`);
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

  suspend(id: string, payload: SuspendPupilPayload) {
    return client.post<Pupil>(`/pupils/${id}/suspend`, payload);
  },

  reactivate(id: string) {
    return client.post<Pupil>(`/pupils/${id}/reactivate`, {});
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

export function usePupilQuery(id: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.pupils, "detail", id],
    queryFn: () => pupilsApi.get(id),
    enabled: Boolean(token && id),
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

export function useSuspendPupilMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SuspendPupilPayload }) => pupilsApi.suspend(id, payload),
    onSuccess: (pupil) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pupils });
      toast.success(`${pupil.fullName} suspended`);
    },
    onError: (err) => toastError(err, "Could not suspend this pupil"),
  });
}

export function useReactivatePupilMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pupilsApi.reactivate(id),
    onSuccess: (pupil) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pupils });
      toast.success(`${pupil.fullName} reactivated`);
    },
    onError: (err) => toastError(err, "Could not reactivate this pupil"),
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
