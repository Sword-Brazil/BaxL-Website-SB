import type { BattleClock, Settings } from "@/models/domain/types";
import { apiFetch } from "./client";

export const getClock = () => apiFetch<{ clock: BattleClock; settings: Settings }>("/api/clock");
