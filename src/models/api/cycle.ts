import type { CycleOverview } from "@/models/domain/types";
import { apiFetch } from "./client";

export const getCycle = () => apiFetch<CycleOverview>("/api/cycle");
