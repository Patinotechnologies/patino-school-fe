import toast from "react-hot-toast";
import { ApiError } from "@/lib/api/api-client";

export function toastError(err: unknown, fallback = "Something went wrong") {
  toast.error(err instanceof ApiError ? err.message : fallback);
}
