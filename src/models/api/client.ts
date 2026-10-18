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
    throw new ApiError(res.status, err?.code ?? "INTERNAL_ERROR", err?.message ?? res.statusText, err?.fields);
  }
  return data as T;
}
