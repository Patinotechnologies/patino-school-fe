import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createApiClient } from "@/lib/api/api-client";
import { toastError } from "@/lib/utils/toast-error";
import { apiConfig } from "@/config/api";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { StaffAttendanceEntry, StaffAttendanceSettings, UpdateStaffAttendanceSettingsPayload } from "@/types/staff-attendance";

const client = createApiClient(apiConfig.baseUrl);

export const staffAttendanceApi = {
  getSettings() {
    return client.get<StaffAttendanceSettings>("/staff-attendance/settings");
  },

  updateSettings(payload: UpdateStaffAttendanceSettingsPayload) {
    return client.put<StaffAttendanceSettings>("/staff-attendance/settings", payload);
  },

  list(date?: string) {
    return client.get<StaffAttendanceEntry[]>(`/staff-attendance${date ? `?date=${date}` : ""}`);
  },
};

export function useStaffAttendanceSettingsQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: queryKeys.staffAttendanceSettings,
    queryFn: () => staffAttendanceApi.getSettings(),
    enabled: Boolean(token),
  });
}

export function useUpdateStaffAttendanceSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStaffAttendanceSettingsPayload) => staffAttendanceApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffAttendanceSettings });
      queryClient.invalidateQueries({ queryKey: queryKeys.staffAttendance });
      toast.success("Check-in rules saved");
    },
    onError: (err) => toastError(err, "Could not save check-in rules"),
  });
}

export function useStaffAttendanceQuery(date?: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...queryKeys.staffAttendance, date ?? "today"],
    queryFn: () => staffAttendanceApi.list(date),
    enabled: Boolean(token),
  });
}
