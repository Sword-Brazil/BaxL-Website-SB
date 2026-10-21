import Router from "next/router";
import type { ApiErrorBody } from "@/models/schemas/common";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

/** fetch tipado para as API Routes; converte o erro padrão em ApiError. */
export async function apiFetch<T>(url: string, init: Omit<RequestInit, "body"> & { body?: unknown } = {}): Promise<T> {
  const { body, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    // Site privado: sessão expirada (ou removida) em qualquer chamada leva de volta ao login.
    if (res.status === 401 && !url.startsWith("/api/auth/") && typeof window !== "undefined" && Router.pathname !== "/entrar") {
      void Router.push({ pathname: "/entrar", query: { next: Router.asPath } });
    }
    throw new ApiError(res.status, err?.code ?? "INTERNAL_ERROR", err?.message ?? res.statusText, err?.fields);
  }
  return data as T;
}
