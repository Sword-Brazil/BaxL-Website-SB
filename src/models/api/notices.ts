import type { SecurityNotice } from "@/models/domain/securityEvents";
import { apiFetch } from "./client";

export const getNotices = () => apiFetch<SecurityNotice[]>("/api/me/notices");
export const dismissNotice = (id: string) => apiFetch<void>(`/api/me/notices/${id}`, { method: "DELETE" });
