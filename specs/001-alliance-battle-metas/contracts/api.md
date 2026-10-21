# API Contract (Next.js API Routes, `pages/api`)

**Feature**: `001-alliance-battle-metas` | **Date**: 2026-10-17 | **Atualizado**: 2026-10-21 (site
privado, login por nome de usuário, Postgres/Supabase)

## Convenções

- Corpo e resposta em JSON. Toda entrada é validada por um schema Zod compartilhado
  (`src/models/schemas`). Os nomes de schema citados abaixo são os exportados de lá.
- **Site privado**: `src/proxy.ts` exige sessão em **toda** página e rota de API, exceto `/entrar`,
  `/api/auth/*` e arquivos estáticos. Sem sessão: páginas redirecionam para
  `/entrar?next=<caminho>`; APIs (e `/_next/data`) respondem 401. Cada rota também confere a
  sessão no banco (`requireUser` / `requireRole`).
- **Sessão**: cookie `mff_session` (iron-session, httpOnly, SameSite=Lax, Secure em produção).
  "Manter logado" = 30 dias; sem ele, cookie de sessão + limite de 12 h.
- **Acesso**: `public` (sem sessão), `user` (qualquer conta), `curator` (CURATOR ou ADMIN),
  `admin` (ADMIN).
- **CSRF**: POST/PUT/PATCH/DELETE precisam de `Origin` (ou `Referer`) deste site → senão 403;
  com corpo, `Content-Type: application/json` → senão 415.
- **Erros**: `{ "error": { "code": string, "message": string, "fields"?: Record<string,string[]> } }`

| Status | Código | Como a interface mostra |
|--------|--------|------------------------|
| 400 / 415 | `VALIDATION_ERROR` (com `fields`) | no formulário ou notificação |
| 401 | `UNAUTHENTICATED` | alerta fixo "sessão terminou" (no login: no formulário) |
| 403 | `FORBIDDEN` | alerta fixo "acesso negado" |
| 404 | `NOT_FOUND` | notificação |
| 409 | `CONFLICT` (ex.: usuário já existe, último admin, seleções alteradas em outro aparelho) | notificação / diálogo |
| 422 | `RESTRICTION_VIOLATION` (equipe não respeita a restrição do dia) | notificação |
| 429 | `RATE_LIMITED` | notificação de alerta (no login: no formulário) |
| 500 | `INTERNAL_ERROR` (sem detalhes em produção) | alerta fixo "erro no servidor" |
| 503 | `SERVICE_UNAVAILABLE` (banco inacessível; `Retry-After: 5`) | alerta fixo "sem conexão com o banco" |

- Escritas de conteúdo registram `updatedById` e `updatedAt`.

## Leitura (membros)

| Método | Rota | Acesso | Resposta |
|--------|------|--------|----------|
| GET | `/api/clock` | user | `{ clock: BattleClock, settings: Settings }` |
| GET | `/api/catalog` | user | `{ agents: Agent[] (com uniforms[]), ctps: Ctp[] }` (ETag) |
| GET | `/api/cycle` | user | `season` (`{ BAX, BAL }`: efeito da temporada) e os 28 dias com BAX, BAL e BAI (tela central) |
| GET | `/api/days?mode=BAX\|BAL` | user | `DaySummary[]` |
| GET | `/api/days/{mode}/{number}` | user | `DayDetail` (criteria[], metaTeams[], priority) |
| GET | `/api/bal-free` | user | `MetaTeam[]` |
| GET | `/api/bai` | user | `{ bosses, metaTeams, priority, nextStart }` |
| GET | `/api/rotations` | user | rotações dos Causadores de Dano (por personagem/traje, com vídeo) |

`{number}` de um dia de BAI (3, 10, 17, 24) → 404.

## Autenticação

| Método | Rota | Acesso | Corpo (Zod) | Resposta |
|--------|------|--------|-------------|----------|
| POST | `/api/auth/login` | public | `LoginSchema` {username, password, remember?} | 200 `SessionUser`; 401 genérico ("Usuário ou senha incorretos"); 429 após 5 falhas (conta+IP) ou 20 (conta, qualquer IP) em 15 min |
| POST | `/api/auth/logout` | public | — | 204 |
| GET | `/api/auth/me` | public | — | `SessionUser \| null` |

`SessionUser = { id, username, nickname, role }`. Não há cadastro, confirmação de e-mail nem
recuperação de senha: contas e senhas são geridas por Administradores.

## Conta do membro

| Método | Rota | Acesso | Corpo | Resposta |
|--------|------|--------|-------|----------|
| GET | `/api/me/selections` | user | — | `UserSelections \| null` |
| PUT | `/api/me/selections` | user | `PutSelectionsSchema` {selections, baseUpdatedAt?} | 200 `UserSelections`; 409 se outro aparelho salvou antes (o cliente pergunta qual versão manter) |
| GET | `/api/me/notices` | user | — | avisos de segurança abertos |
| DELETE | `/api/me/notices/{id}` | user | — | dispensa o aviso |

## Curadoria

| Método | Rota | Acesso | Corpo |
|--------|------|--------|-------|
| PUT | `/api/admin/days/{mode}/{number}/restriction` | curator | `RestrictionSchema` {criteria: [{attribute, value}]} |
| GET / POST | `/api/admin/meta-teams` | curator | `MetaTeamSchema` (3 membros; Causador de Dano com `strikerUniformId` opcional) → 422 se violar a restrição |
| PUT / DELETE | `/api/admin/meta-teams/{id}` | curator | idem |
| GET / PUT | `/api/admin/priority/{scope}/{mode?}/{number?}` | curator | `PrioritySchema` {solo[], support[]} |
| GET / PUT | `/api/admin/bai/bosses` | curator | `BaiBossesSchema` |
| POST / PUT | `/api/admin/agents[/{id}]` | curator | `AgentSchema` (+ uniformes) |
| PUT | `/api/admin/agents/{id}/rotations` | curator | rotações (temporada, sequência, descrição, vídeo https do YouTube ou .mp4/.webm) |
| GET / PUT | `/api/admin/season` | curator | `SeasonSchema` (`{ BAX: SILENCE\|PARALYSIS\|BURN, BAL: FRACTURE\|SHOCK\|TRAP }`) |
| POST | `/api/admin/assets` | curator | `AssetUploadSchema` {fileName, mimeType: png\|webp\|jpeg, base64} (≤ 2 MB; o conteúdo é conferido) → `{ imagePath }` = URL pública no Supabase Storage (`public/assets/uploads` só no ambiente local sem Supabase) |
| POST / PUT / DELETE | `/api/admin/ctps[/{id}]` | admin | CTPs (tipo, qualidade, imagem, ativo) |
| GET / PUT | `/api/admin/settings` | admin | `SettingsSchema` |

## Administração de contas

| Método | Rota | Acesso | Corpo | Notas |
|--------|------|--------|-------|-------|
| GET | `/api/admin/users?q=&page=` | admin | — | lista paginada; busca por usuário ou apelido |
| POST | `/api/admin/users` | admin | `CreateUserSchema` {username, password (forte), nickname?, role: USER\|CURATOR\|ADMIN} | 409 se o usuário existir |
| PATCH | `/api/admin/users/{id}/role` | admin | {role} | 409 ao rebaixar o último ADMIN |
| POST | `/api/admin/users/{id}/reset-password` | admin | {password (forte)} | a senha antiga para de valer; aviso crítico ao dono |

## Rotas de UI (Pages Router)

Prefixo de idioma automático: `/`, `/en/`, `/es/`. Todas exigem login, exceto `/entrar`.

| Rota | Acesso | Conteúdo |
|------|--------|----------|
| `/entrar` | public | Login (usuário, senha, "Manter logado") |
| `/` | user | Tela central: 28 dias com BAX e BAL lado a lado (Meta e Alternativa) e BAI |
| `/bal/livre` | user | Equipes do modo livre |
| `/meu-elenco` | user | Agentes e uniformes possuídos, CTPs; backup |
| `/rotacoes`, `/rotacoes/[slug]` | user | Rotações dos Causadores de Dano, com vídeo |
| `/estatisticas` | user | Gráficos |
| `/admin` (+ `dias`, `metas`, `catalogo`, `rotacoes`, `bai`) | curator | Curadoria |
| `/admin/ctps`, `/admin/usuarios`, `/admin/config` | admin | CTPs, contas e calendário |
