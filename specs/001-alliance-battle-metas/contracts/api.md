# API Contract (Next.js API Routes, `pages/api`)

**Feature**: `001-alliance-battle-metas` | **Date**: 2026-10-17

## Convenções

- Corpo e resposta em JSON. Toda entrada é validada por um schema Zod compartilhado
  (`src/models/schemas`).
- Os nomes de schema citados abaixo são os exportados de lá.
- **Auth**: cookie `mff_session` (iron-session, httpOnly, SameSite=Lax). Coluna "Acesso":
  - `public`: sem sessão.
  - `user`: qualquer sessão.
  - `curator`: papel CURATOR ou ADMIN.
  - `admin`: papel ADMIN.
- **Erros**: `{ "error": { "code": string, "message": string, "fields"?: Record<string,string[]> } }`

| Status | Código |
|--------|--------|
| 400 | `VALIDATION_ERROR` (com `fields`) |
| 401 | `UNAUTHENTICATED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` (ex.: e-mail já em uso, último admin) |
| 422 | `RESTRICTION_VIOLATION` (equipe não respeita a restrição do dia) |
| 429 | `RATE_LIMITED` |

- Escritas de conteúdo registram `updatedById` e `updatedAt`.

## Público (leitura)

| Método | Rota | Acesso | Resposta |
|--------|------|--------|----------|
| GET | `/api/clock` | public | `{ clock: BattleClock, settings: Settings }` (o cliente usa `clock.now` para corrigir a diferença de relógio e `settings` para recalcular a cada minuto) |
| GET | `/api/catalog` | public | `{ agents: Agent[] (com uniforms[]), ctps: Ctp[] }`, com cache longo |
| GET | `/api/days?mode=BAX\|BAL` | public | `DaySummary[]` (number, weekday, criteria[], primaryTeam?, updatedAt?) |
| GET | `/api/days/{mode}/{number}` | public | `DayDetail` (criteria[], metaTeams[], priority: {solo[], support[]}) |
| GET | `/api/bal-free` | public | `MetaTeam[]` |
| GET | `/api/bai` | public | `{ bosses: BaiBoss[], metaTeams: MetaTeam[], priority, nextStart }` |

`{number}` de um dia de BAI (3, 10, 17, 24) → 404.

## Autenticação

| Método | Rota | Acesso | Corpo (Zod) | Resposta |
|--------|------|--------|-------------|----------|
| POST | `/api/auth/register` | public | `RegisterSchema` {email, password (≥ 8, letra e número), nickname?} | 201 `{ ok }`; o link de verificação vai para o `MailService` (console no modo local). Resposta idêntica se o e-mail já existir |
| POST | `/api/auth/verify-email` | public | {token} | 200 / 400 |
| POST | `/api/auth/login` | public | `LoginSchema` {email, password} | 200 `SessionUser`; 401 genérico; 429 após 5 falhas |
| POST | `/api/auth/logout` | user | — | 204 |
| GET | `/api/auth/me` | public | — | `SessionUser \| null` |
| POST | `/api/auth/forgot-password` | public | {email} | 200 sempre (não revela se o e-mail existe) |
| POST | `/api/auth/reset-password` | public | `ResetPasswordSchema` {token, password} | 200 / 400 |

`SessionUser = { id, email, nickname?, role }`

## Seleções do usuário (sincronização)

| Método | Rota | Acesso | Corpo | Resposta |
|--------|------|--------|-------|----------|
| GET | `/api/me/selections` | user | — | `UserSelections \| null` |
| PUT | `/api/me/selections` | user | `UserSelectionsSchema` + `baseUpdatedAt?` | 200 `UserSelections`; 409 se `baseUpdatedAt` divergir (o cliente pede ao usuário para escolher) |

## Curadoria

| Método | Rota | Acesso | Corpo |
|--------|------|--------|-------|
| PUT | `/api/admin/days/{mode}/{number}/restriction` | curator | `RestrictionSchema` {criteria: [{attribute, value}]}, sem atributo repetido |
| POST | `/api/admin/meta-teams` | curator | `MetaTeamSchema` {scope, mode?, number?, isPrimary, label?, notes?, members: [{slot, uniformId, ctpId}] ×3} → 422 se violar a restrição |
| PUT / DELETE | `/api/admin/meta-teams/{id}` | curator | idem |
| PUT | `/api/admin/priority/{scope}/{mode?}/{number?}` | curator | `PrioritySchema` {solo: [{uniformId, ctpId?}], support: [...]} (a ordem é o rank) |
| PUT | `/api/admin/bai/bosses` | curator | `BaiBossesSchema` [{position, name, imagePath?, tips?}] |
| POST / PUT | `/api/admin/agents[/{id}]` | curator | `AgentSchema` (+ uniforms) |
| POST | `/api/admin/assets` | curator | `AssetUploadSchema` {fileName, mimeType: `image/png`\|`image/webp`, base64} (≤ 2 MB decodificado) → `{ imagePath }` (salvo em `public/assets/uploads/`) |
| PUT | `/api/admin/settings` | admin | `SettingsSchema` {cycleAnchor, dayTurnoverHour, weeklyResetHour, baiWeekday} |

## Administração de contas

| Método | Rota | Acesso | Corpo | Notas |
|--------|------|--------|-------|-------|
| GET | `/api/admin/users?q=` | admin | — | lista paginada |
| POST | `/api/admin/users` | admin | `CreateStaffSchema` {email, password, nickname?, role: CURATOR\|ADMIN} | cadastro de novos ADMs/curadores, já verificado |
| PATCH | `/api/admin/users/{id}/role` | admin | {role} | 409 ao rebaixar o último ADMIN |
| POST | `/api/admin/users/{id}/reset-password` | admin | {password} | redefinição manual (sem e-mail no modo local) |

## Rotas de UI (Pages Router)

Prefixo de idioma automático: `/`, `/en/`, `/es/`.

| Rota | Acesso | Conteúdo |
|------|--------|----------|
| `/` | public | Hoje: dia atual de BAX e BAL (ou destaque da BAI), atalhos para os dias |
| `/bax`, `/bal` | public | Grade dos dias do ciclo (sem os dias de BAI) |
| `/bax/[day]`, `/bal/[day]` | public | Detalhe: restrição, Meta(s), Minha equipe, sugestão, paleta de CTPs |
| `/bal/livre` | public | Equipes do modo livre |
| `/bai` | public | Explicação, chefes, equipes, sugestão |
| `/meu-elenco` | public | Marcar agentes e uniformes possuídos; exportar/importar backup |
| `/entrar`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/verificar-email` | public | Auth |
| `/admin` (+ `/admin/dias`, `/admin/metas`, `/admin/catalogo`, `/admin/bai`, `/admin/usuarios`, `/admin/config`) | curator / admin | Curadoria e gestão |

A navegação até qualquer dia leva no máximo 2 interações: aba BAX/BAL e depois o dia (FR-004).
