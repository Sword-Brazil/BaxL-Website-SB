import type { Role, TeamScope } from "@/models/domain/enums";
import type { BaiBoss, Ctp, Criterion, MetaTeam, PriorityLists, Rotation, Season, SessionUser, Settings } from "@/models/domain/types";
import type {
  AgentInput,
  AgentRotationsInput,
  CtpInput,
  AssetUploadInput,
  BaiBossesInput,
  CreateUserInput,
  MetaTeamInput,
  PriorityInput,
  PriorityTarget,
  SeasonInput,
  SettingsInput,
} from "@/models/schemas/admin";
import { apiFetch } from "./client";

const priorityPath = (t: PriorityTarget) =>
  t.scope === "DAY" ? `/api/admin/priority/DAY/${t.mode}/${t.number}` : "/api/admin/priority/BAI";

export interface AdminUser extends SessionUser {
  createdAt: string;
  /** Conta antiga que repete o usuário ou o apelido de outra (criada antes do bloqueio). */
  duplicate: boolean;
}

export const adminApi = {
  getSeason: () => apiFetch<Season>("/api/admin/season"),
  setSeason: (body: SeasonInput) => apiFetch<Season>("/api/admin/season", { method: "PUT", body }),
  setRestriction: (mode: string, number: number, criteria: Criterion[]) =>
    apiFetch<{ criteria: Criterion[] }>(`/api/admin/days/${mode}/${number}/restriction`, { method: "PUT", body: { criteria } }),

  listMetaTeams: (scope: TeamScope, mode?: string, number?: number) => {
    const qs = new URLSearchParams({ scope, ...(mode ? { mode } : {}), ...(number ? { number: String(number) } : {}) });
    return apiFetch<MetaTeam[]>(`/api/admin/meta-teams?${qs}`);
  },
  createMetaTeam: (body: MetaTeamInput) => apiFetch<MetaTeam>("/api/admin/meta-teams", { method: "POST", body }),
  updateMetaTeam: (id: string, body: MetaTeamInput) => apiFetch<MetaTeam>(`/api/admin/meta-teams/${id}`, { method: "PUT", body }),
  deleteMetaTeam: (id: string) => apiFetch<void>(`/api/admin/meta-teams/${id}`, { method: "DELETE" }),
  reorderMetaTeams: (ids: string[]) => apiFetch<void>("/api/admin/meta-teams/order", { method: "PUT", body: { ids } }),

  getPriority: (t: PriorityTarget) => apiFetch<PriorityLists>(priorityPath(t)),
  savePriority: (t: PriorityTarget, body: PriorityInput) => apiFetch<PriorityLists>(priorityPath(t), { method: "PUT", body }),

  getBosses: () => apiFetch<BaiBoss[]>("/api/admin/bai/bosses"),
  saveBosses: (body: BaiBossesInput) => apiFetch<BaiBoss[]>("/api/admin/bai/bosses", { method: "PUT", body }),

  createAgent: (body: AgentInput) => apiFetch<unknown>("/api/admin/agents", { method: "POST", body }),
  updateAgent: (id: string, body: AgentInput) => apiFetch<unknown>(`/api/admin/agents/${id}`, { method: "PUT", body }),
  saveRotations: (agentId: string, body: AgentRotationsInput) =>
    apiFetch<Rotation[]>(`/api/admin/agents/${agentId}/rotations`, { method: "PUT", body }),
  createCtp: (body: CtpInput) => apiFetch<Ctp>("/api/admin/ctps", { method: "POST", body }),
  updateCtp: (id: string, body: CtpInput) => apiFetch<Ctp>(`/api/admin/ctps/${id}`, { method: "PUT", body }),
  deleteCtp: (id: string) => apiFetch<void>(`/api/admin/ctps/${id}`, { method: "DELETE" }),
  uploadAsset: (body: AssetUploadInput) => apiFetch<{ imagePath: string }>("/api/admin/assets", { method: "POST", body }),

  getSettings: () => apiFetch<Settings>("/api/admin/settings"),
  saveSettings: (body: SettingsInput) => apiFetch<Settings>("/api/admin/settings", { method: "PUT", body }),

  listUsers: (q = "", page = 1) =>
    apiFetch<{ total: number; page: number; pageSize: number; users: AdminUser[] }>(
      `/api/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page) })}`,
    ),
  createUser: (body: CreateUserInput) => apiFetch<SessionUser>("/api/admin/users", { method: "POST", body }),
  changeRole: (id: string, role: Role) => apiFetch<SessionUser>(`/api/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
  deleteUser: (id: string) => apiFetch<void>(`/api/admin/users/${id}`, { method: "DELETE" }),
  resetPassword: (id: string, password: string) =>
    apiFetch<void>(`/api/admin/users/${id}/reset-password`, { method: "POST", body: { password } }),
};
