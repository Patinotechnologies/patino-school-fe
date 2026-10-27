import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type {
  AttendanceSession,
  ListAttendanceLogParams,
  ListAttendanceParams,
  MarkAttendancePayload,
  PaginatedAttendanceLog,
} from "@/types/attendance";

const client = createApiClient(apiConfig.baseUrl);

function toQueryString(params: ListAttendanceParams): string {
  const search = new URLSearchParams();
  search.set("classId", params.classId);
  if (params.date) search.set("date", params.date);
  return `?${search.toString()}`;
}

function toLogQueryString(params: ListAttendanceLogParams): string {
  const search = new URLSearchParams();
  search.set("schoolId", params.schoolId);
  if (params.classId) search.set("classId", params.classId);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  return `?${search.toString()}`;
}

export const attendanceApi = {
  list(params: ListAttendanceParams) {
    return client.get<AttendanceSession[]>(`/attendance${toQueryString(params)}`);
  },

  listLog(params: ListAttendanceLogParams) {
    return client.get<PaginatedAttendanceLog>(`/attendance/log${toLogQueryString(params)}`);
  },

  mark(payload: MarkAttendancePayload) {
    return client.post<AttendanceSession>("/attendance", payload);
  },
};

export function useAttendanceSessionsQuery(params: ListAttendanceParams) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.attendance, params],
    queryFn: () => attendanceApi.list(params),
    enabled: Boolean(token && params.classId),
  });
}

export function useAttendanceLogQuery(params: ListAttendanceLogParams | null) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.attendance, "log", params],
    queryFn: () => attendanceApi.listLog(params!),
    enabled: Boolean(token && params?.schoolId),
  });
}

export function useMarkAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MarkAttendancePayload) => attendanceApi.mark(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
      toast.success("Attendance saved");
    },
    onError: (err) => toastError(err, "Could not save attendance"),
  });
}
