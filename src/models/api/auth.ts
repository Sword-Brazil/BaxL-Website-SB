import type { SessionUser } from "@/models/domain/types";
import type { LoginInput, RegisterInput } from "@/models/schemas/auth";
import type { UserSelections } from "@/models/schemas/selections";
import { apiFetch } from "./client";

export const getMe = () => apiFetch<SessionUser | null>("/api/auth/me");
export const postLogin = (body: LoginInput) => apiFetch<SessionUser>("/api/auth/login", { method: "POST", body });
export const postLogout = () => apiFetch<void>("/api/auth/logout", { method: "POST" });

export const postRegister = (body: RegisterInput) => apiFetch<{ ok: true }>("/api/auth/register", { method: "POST", body });
export const postVerifyEmail = (token: string) => apiFetch<{ ok: true }>("/api/auth/verify-email", { method: "POST", body: { token } });
export const postForgotPassword = (email: string) =>
  apiFetch<{ ok: true }>("/api/auth/forgot-password", { method: "POST", body: { email } });
export const postResetPassword = (token: string, password: string) =>
  apiFetch<{ ok: true }>("/api/auth/reset-password", { method: "POST", body: { token, password } });

export const getRemoteSelections = () => apiFetch<UserSelections | null>("/api/me/selections");
export const putRemoteSelections = (selections: UserSelections, baseUpdatedAt: string | null) =>
  apiFetch<UserSelections>("/api/me/selections", { method: "PUT", body: { selections, baseUpdatedAt } });
