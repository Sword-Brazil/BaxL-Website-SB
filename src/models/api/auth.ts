import type { SessionUser } from "@/models/domain/types";
import type { LoginInput } from "@/models/schemas/auth";
import { apiFetch } from "./client";

// Login só da curadoria (curadores e administradores); os dados do jogador ficam no aparelho.
export const getMe = () => apiFetch<SessionUser | null>("/api/auth/me");
export const postLogin = (body: LoginInput) => apiFetch<SessionUser>("/api/auth/login", { method: "POST", body });
export const postLogout = () => apiFetch<void>("/api/auth/logout", { method: "POST" });
