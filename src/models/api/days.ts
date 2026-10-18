import type { DayMode } from "@/models/domain/enums";
import type { DayDetail, DaySummary, MetaTeam } from "@/models/domain/types";
import { apiFetch } from "./client";

export const getDays = (mode: DayMode) => apiFetch<DaySummary[]>(`/api/days?mode=${mode}`);
export const getDay = (mode: DayMode, number: number) => apiFetch<DayDetail>(`/api/days/${mode}/${number}`);
export const getBalFree = () => apiFetch<MetaTeam[]>("/api/bal-free");
