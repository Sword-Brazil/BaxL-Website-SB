import type { BattleClock, Season, Settings } from "@/models/domain/types";
import { apiFetch } from "./client";

export const getClock = () => apiFetch<{ clock: BattleClock; settings: Settings; season: Season }>("/api/clock");
