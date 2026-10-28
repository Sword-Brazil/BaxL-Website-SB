import { apiFetch } from "./client";

/** Banco acessível e na versão do código? Resolve (204) ou lança ApiError (503 MAINTENANCE…). */
export const getHealth = () => apiFetch<void>("/api/health", { cache: "no-store" });
