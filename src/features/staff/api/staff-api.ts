import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { CreateStaffPayload, ListStaffParams, PaginatedStaff, Staff } from "@/types/staff";

const client = createApiClient(apiConfig.baseUrl);

function toQueryString(params: ListStaffParams = {}): string {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.role) search.set("role", params.role);
  if (params.active !== undefined) search.set("active", String(params.active));
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const staffApi = {
  list(params?: ListStaffParams) {
    return client.get<PaginatedStaff>(`/staff${toQueryString(params)}`);
  },

  get(id: string) {
    return client.get<Staff>(`/staff/${id}`);
  },

  create(payload: CreateStaffPayload) {
    return client.post<Staff>("/staff", payload);
  },
};

export function useStaffQuery(params: ListStaffParams = {}) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.staff, params],
    queryFn: () => staffApi.list(params),
    enabled: Boolean(token),
  });
}

export function useStaffMemberQuery(id: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.staff, "detail", id],
    queryFn: () => staffApi.get(id),
    enabled: Boolean(token && id),
  });
}

export function useCreateStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => staffApi.create(payload),
    onSuccess: (staff) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      toast.success(`${staff.fullName} added`);
    },
    onError: (err) => toastError(err, "Could not add staff member"),
  });
}
