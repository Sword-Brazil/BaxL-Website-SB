import type { SessionUser } from "@/models/domain/types";
import type { LoginInput } from "@/models/schemas/auth";
import type { UserSelections } from "@/models/schemas/selections";
import { apiFetch } from "./client";

// Contas criadas por um administrador: jogadores (nome de usuário) e curadoria (e-mail).
export const getMe = () => apiFetch<SessionUser | null>("/api/auth/me");
export const postLogin = (body: LoginInput) => apiFetch<SessionUser>("/api/auth/login", { method: "POST", body });
export const postLogout = () => apiFetch<void>("/api/auth/logout", { method: "POST" });

// Elenco, equipes, CTPs e nome no jogo de quem está logado (sincronizados entre aparelhos).
export const getRemoteSelections = () => apiFetch<UserSelections | null>("/api/me/selections");
export const putRemoteSelections = (selections: UserSelections, baseUpdatedAt: string | null) =>
  apiFetch<UserSelections>("/api/me/selections", { method: "PUT", body: { selections, baseUpdatedAt } });
