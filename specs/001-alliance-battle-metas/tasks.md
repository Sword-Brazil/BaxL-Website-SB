---

description: "Task list for Plataforma de Metas da Batalha de Aliança (Sword Brazil)"
---

# Tasks: Plataforma de Metas da Batalha de Aliança (Sword Brazil)

**Input**: Design documents from `/specs/001-alliance-battle-metas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**:
- Vitest (autorizado em 2026-10-17) cobre as regras de domínio (`src/models/rules`), os schemas
  Zod e os services do servidor, em ambiente Node.
- Testes de hooks de ViewModel ficam de fora até `jsdom` e `@testing-library/react` serem
  autorizados.
- Os testes de cada story vêm antes da implementação e precisam falhar primeiro.

**Organization**: tasks agrupadas por user story. Ordem de entrega: US1 (P1, MVP) → US5 (P1) →
US2 (P2) → US3 (P2) → US4 (P3).

**Regra global**:
- Nenhuma lib fora da tabela de dependências de `research.md` pode ser instalada sem
  autorização do usuário.
- Nenhum componente visual é criado do zero: usar `npx shadcn@latest add <componente>` (ou os
  registries Origin UI e Magic UI) e só restilizar.
- Todo texto de UI vem de `public/locales/{pt-BR,en,es}/*.json`. Termos do jogo (BAX, BAL, BAI,
  CTP, nomes de agentes) não são traduzidos.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: user story da spec (US1–US5)

## Path Conventions

Monolito Next.js (Pages Router) na raiz do repositório: `src/`, `prisma/`, `public/`, `scripts/`,
`tests/`. MVVM:
- `src/models` (Model)
- `src/viewmodels` (ViewModel)
- `src/views` + `src/pages` (View)
- `src/server` (somente servidor)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicializar o projeto com as libs aprovadas

- [X] T001 Criar o app Next.js com TypeScript, **Pages Router** e diretório `src/`. Gerar numa pasta temporária (`npx create-next-app@latest /tmp/mff-app --ts --eslint --src-dir --no-app --import-alias "@/*"`), porque o `create-next-app` recusa pastas com arquivos que podem conflitar. Depois mover o conteúdo para a raiz do repositório sem sobrescrever `.specify/`, `.claude/`, `specs/` e `.git/`, e apagar a pasta temporária
- [X] T002 Configurar Tailwind CSS v4 (`@tailwindcss/postcss`) em `postcss.config.mjs` e `src/styles/globals.css` com `@import "tailwindcss";`
- [X] T003 Inicializar shadcn/ui (`npx shadcn@latest init`) gerando `components.json`, `src/lib/utils.ts` e os aliases `@/components/ui`
- [X] T004 Instalar as dependências aprovadas: `next-i18next i18next react-i18next next-themes zod react-hook-form @hookform/resolvers lucide-react @dnd-kit/core @tanstack/react-query zustand html-to-image @prisma/client bcryptjs iron-session` e, como dev, `prisma vitest @types/bcryptjs tsx` (`tsx` e `@types/bcryptjs` autorizados em 2026-10-17). Registrar a lista em `package.json`
- [X] T005 [P] Configurar Vitest com ambiente `node` e alias `@/` em `vitest.config.ts`; adicionar os scripts `test`, `test:watch` em `package.json`
- [X] T006 Criar `tests/setup/db.ts` (o arquivo pode ser criado já, mas só funciona depois de T015, que gera as migrações): `globalSetup` que define `DATABASE_URL=file:./test.db`, aplica as migrações (`prisma migrate deploy`) e exporta `resetDb()`, que limpa todas as tabelas. Registrar em `vitest.config.ts` (`globalSetup` + `setupFiles` chamando `resetDb()` em `beforeEach` para os testes de `tests/unit/server/**`)
- [X] T007 [P] Criar `.env.example` com `DATABASE_URL="file:./dev.db"`, `SESSION_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`; adicionar `.env.local`, `prisma/*.db*` e `public/assets/uploads/` ao `.gitignore`
- [X] T008 [P] Criar a estrutura de pastas do plano (`src/models/{domain,schemas,rules,api}`, `src/viewmodels/{stores,admin}`, `src/views/{layout,today,day,roster,bai,auth,admin}`, `src/components/{ui,origin,magic}`, `src/server/{repositories,services}`, `tests/unit/{models,server}`, `scripts/`) com um `.gitkeep` onde estiver vazia

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: domínio, banco, sessão, i18n, tema e layout. Nada das stories começa antes disto.

### Model de domínio e schemas

- [X] T009 [P] Criar os enums de domínio como `const` + tipos em `src/models/domain/enums.ts`, conforme `data-model.md`:
  - `Mode` = `BAX|BAL|BAI`; `Role` = `USER|CURATOR|ADMIN`; `Gender` = `MALE|FEMALE|NONE`; `Side` = `HERO|VILLAIN`.
  - `Species` = `MUTANT|INHUMAN|HUMAN|ALIEN|NEO_HUMAN|OTHER`; `AttackType` = `COMBAT|BLAST|SPEED|UNIVERSAL`.
  - `CriterionAttribute` = `GENDER|SIDE|SPECIES|ATTACK_TYPE`.
  - `CtpType` = `RAGE|LIBERATION|INSIGHT|COMPETITION|JUDGEMENT|ASCENT|AUTHORITY`; `CtpQuality` = `NORMAL|MIGHTY|BRILLIANT`.
  - `Slot` = `SOLO|SUPPORT_1|SUPPORT_2`; `TeamScope` = `DAY|BAL_FREE|BAI`.
  - Constantes `BAI_DAYS = [3,10,17,24]` e `WEEKDAYS = ["QUI","SEX","SÁB","DOM","SEG","TER","QUA"]`.
- [X] T010 [P] Criar os tipos de entidades de leitura (`Agent`, `Uniform`, `Ctp`, `Criterion`, `MetaTeam`, `MetaTeamMember`, `PriorityEntry`, `BaiBoss`, `Settings`, `SessionUser`, `BattleClock`, `DaySummary`, `DayDetail`) em `src/models/domain/types.ts`
- [X] T011 [P] Criar os schemas Zod base em `src/models/schemas/common.ts`:
  - Enums: `z.enum` de cada enum de T009.
  - `dayNumberSchema`: inteiro de 1 a 28 que rejeita `BAI_DAYS`.
  - `emailSchema`: trim + lowercase + email.
  - `passwordSchema`: "≥ 8, letra e número".
  - `apiErrorSchema` no formato `{ error: { code, message, fields? } }`.
- [X] T012 [P] Escrever o teste de `src/models/schemas/common.ts` em `tests/unit/models/schemas.common.test.ts`: dia 0, 29, 3, 10, 17 e 24 inválidos; 1, 4 e 28 válidos; senha "abcdefgh" inválida e "abcdefg1" válida

### Regra de calendário (base de tudo)

- [X] T013 [P] Escrever os testes de `getBattleClock(now, settings)` em `tests/unit/models/battleClock.test.ts`:
  - A âncora é uma quinta-feira 12:00 BRT.
  - 11:59 BRT continua no dia anterior; 12:00 BRT avança o dia.
  - No dia de reset (o dia que contém as 22:00 da virada de semana): `isResetDay=true`; `beforeWeeklyReset=true` às 21:59 e `false` às 22:00. Às 22:00 o `weekIndex` avança, mas o `cycleDay` **não muda**. O `cycleDay` só avança às 12:00 seguintes.
  - Os dias 3, 10, 17 e 24 retornam `mode="BAI"`.
  - O ciclo dá a volta (dia 28 → dia 1).
  - `nextBaiStart` está correto.
  - O resultado é o mesmo com `process.env.TZ="Asia/Tokyo"`.
- [X] T014 Implementar `getBattleClock` em `src/models/rules/battleClock.ts`, conforme `data-model.md` (Regras derivadas) e research R12:
  - Usar `Intl.DateTimeFormat` com `timeZone: "America/Sao_Paulo"`, sem lib de datas.
  - Ler `dayTurnoverHour` (padrão 12), `weeklyResetHour` (padrão 22) e `baiWeekday` (padrão 3) de `Settings`.
  - Fazer os testes de T013 passarem.

### Banco (Prisma + SQLite)

- [X] T015 Criar `prisma/schema.prisma` (provider `sqlite`) com todos os modelos de `data-model.md`: Agent, Uniform, Ctp, Settings, BattleDay, RestrictionCriterion, MetaTeam, MetaTeamMember, PriorityEntry, BaiBoss, User, AuthToken, LoginAttempt, UserSelectionsDoc.
  - Enums como `String`.
  - Uniques:
    - `Agent.slug`; `(Uniform.agentId, slug)`; `(Ctp.type, quality)`; `(BattleDay.mode, number)`.
    - `(RestrictionCriterion.battleDayId, attribute)`; `(MetaTeamMember.metaTeamId, slot)`.
    - `(PriorityEntry.scope, battleDayId, role, rank)`; `BaiBoss.position`; `User.email`.
  - Campos `active` com padrão `true`; `User.role` com padrão `"USER"`.
  - `createdAt` e `updatedAt` em todas as tabelas de conteúdo.
  - Rodar `npx prisma migrate dev --name init`.
- [X] T016 [P] Criar o Prisma Client singleton (reaproveitado em hot reload) em `src/server/db.ts`
- [X] T017 Criar `prisma/seed.ts` (executado via `tsx`, configurado em `package.json` → `prisma.seed`). O seed é idempotente (upsert) e cria:
  - 21 linhas `Ctp` (7 tipos × 3 qualidades), com `imagePath` `/assets/ctp/<type>_<quality>.png`.
  - 48 `BattleDay`: BAX e BAL, números 1–28 exceto 3, 10, 17 e 24, todos sem critérios ("Sem restrição").
  - `Settings` com `cycleAnchor` na próxima quinta-feira 12:00 BRT (editável depois), `dayTurnoverHour=12`, `weeklyResetHour=22` e `baiWeekday=3`.
  - Usuário ADMIN de `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` e usuário USER de `SEED_USER_EMAIL`/`SEED_USER_PASSWORD`, com hash bcrypt custo 12 e `emailVerifiedAt` preenchido.
- [X] T018 [P] Criar `prisma/seed-demo.ts` e o script `npm run seed:demo`: 12 agentes de exemplo com uniformes "Padrão" (heróis e vilões, gêneros e espécies variados) e uma MetaTeam principal para BAX dia 1, BAX dia 4 e BAL dia 1. Serve só para desenvolvimento e validação da US1 antes da curadoria existir

### Servidor: HTTP, sessão e guards

- [X] T019 [P] Criar em `src/server/http.ts`:
  - `handler({ GET?, POST?, PUT?, PATCH?, DELETE? })`: responde 405 para métodos ausentes.
  - `parseBody(schema, req)`: em caso de erro, responde 400 `VALIDATION_ERROR` com `fields` vindo de `ZodError.flatten().fieldErrors`.
  - `sendError(res, status, code, message)` e a classe `HttpError`, com os códigos de `contracts/api.md`.
- [X] T020 [P] Criar a sessão iron-session em `src/server/session.ts`:
  - Cookie `mff_session`, httpOnly, SameSite=Lax, `secure` em produção, senha `SESSION_SECRET`.
  - Funções `getSession(req,res)`, `requireUser`, `requireRole("CURATOR"|"ADMIN")`. ADMIN satisfaz CURATOR. Respondem 401 `UNAUTHENTICATED` / 403 `FORBIDDEN`.
- [X] T021 [P] Escrever os testes de `authService` em `tests/unit/server/authService.test.ts`, usando SQLite de teste (`DATABASE_URL=file:./test.db`, com reset por teste):
  - O login correto retorna `SessionUser`.
  - Senha errada retorna erro genérico.
  - 5 falhas em 15 min bloqueiam por 15 min (429).
  - O hash nunca é igual à senha.
- [X] T022 Implementar `src/server/services/authService.ts` (login com bcryptjs e controle de `LoginAttempt` pela chave `email|ip`; regra "5 falhas em 15 min → bloqueio de 15 min") e `src/server/repositories/userRepository.ts`. O login **não exige** `emailVerifiedAt`: contas não confirmadas podem entrar. Os testes de T021 devem passar
- [X] T023 Criar as API Routes `src/pages/api/auth/login.ts`, `src/pages/api/auth/logout.ts` e `src/pages/api/auth/me.ts`, conforme `contracts/api.md` (`LoginSchema` em `src/models/schemas/auth.ts`)

### Catálogo e relógio (leitura pública usada por várias stories)

- [X] T024 [P] Criar `src/server/repositories/catalogRepository.ts` e `src/server/services/catalogService.ts`: lista **todos** os agentes e uniformes, inclusive inativos com `active:false` (seleções antigas precisam de nome e imagem para mostrar "indisponível"), e `ctps[]`, em ordem alfabética. Telas de escolha filtram `active:true`
- [X] T025 Criar `src/pages/api/catalog.ts`, com `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600`, e `src/pages/api/clock.ts`, que lê `Settings` e retorna `getBattleClock(new Date(), settings)`
- [X] T026 [P] Criar os clientes tipados `src/models/api/client.ts` (`apiFetch<T>`, que converte o erro padrão em `ApiError`), `src/models/api/catalog.ts` e `src/models/api/clock.ts`

### App shell: i18n, tema, design system, layout

- [X] T027 Configurar next-i18next: `next-i18next.config.js` (`defaultLocale: "pt-BR"`, `locales: ["pt-BR","en","es"]`), `i18n` em `next.config.ts` e os arquivos iniciais `public/locales/{pt-BR,en,es}/common.json` (nav, rodapé, aviso de fã, tema, idioma, "Sem equipe definida", nomes de CTP por `ctp.RAGE`… e de qualidade por `quality.MIGHTY`…)
- [X] T028 Criar os tokens do design system "MFF/MCU" em `src/styles/globals.css` usando `@theme` e variáveis CSS do shadcn, nos modos claro e escuro (escuro padrão):
  - Base azul-marinho metálico, acentos dourado e ciano-energia.
  - Tokens `--hero` (azul), `--villain` (vermelho/roxo) e `--antihero` (âmbar).
  - Tokens `--ctp-normal`, `--ctp-mighty` e `--ctp-brilliant`.
  - Utilitário de canto chanfrado via `clip-path` para Card e Button.
  - Fontes "Oxanium" (títulos) e "Inter" (texto) via `next/font/google` em `src/styles/fonts.ts`.
- [X] T029 Adicionar os componentes shadcn necessários (`npx shadcn@latest add button card badge tabs select dialog alert-dialog dropdown-menu sheet form input label sonner tooltip avatar skeleton separator scroll-area toggle-group command popover table navigation-menu`) e aplicar as variantes MFF (ex.: `variant: "hero" | "villain"` em Badge, borda chanfrada em Card) em `src/components/ui/*`, sem criar componentes novos
- [X] T030 Criar `src/pages/_app.tsx` com `appWithTranslation`, `ThemeProvider` (next-themes, `attribute="class"`, `defaultTheme="dark"`), `QueryClientProvider` e `Toaster` (sonner); criar também `src/pages/_document.tsx` com `lang` dinâmico
- [X] T031 [P] Criar o ViewModel do relógio `src/viewmodels/useBattleClockViewModel.ts`: busca `/api/clock`, calcula a diferença para o relógio local e recalcula `getBattleClock` a cada 60 s, para a virada das 12:00/22:00 aparecer sem recarregar
- [X] T032 Criar o layout `src/views/layout/AppLayout.tsx`, com componentes shadcn:
  - NavigationMenu no desktop e Sheet no mobile, com abas Hoje / BAX / BAL / BAI / Meu elenco.
  - Seletor de idioma (DropdownMenu), alternador de tema e botão Entrar/conta.
  - Rodapé com o aviso de projeto de fã, não oficial e sem fins comerciais (FR-029).
  - Componente `HelpHint` (Popover + ícone) para a ajuda por tela (FR-030).
- [X] T033 [P] Criar a marca da Sword Brazil (FR-028, Constituição III):
  - Logo em `public/brand/sword-brazil.png`. Enquanto o usuário não fornecer o arquivo, usar um espaço reservado com o texto "SWORD BRAZIL" em `src/views/layout/BrandMark.tsx` (feito com componentes shadcn).
  - Favicon e ícones em `public/brand/`.
  - `<title>` padrão "Sword Brazil · Metas BA" em `src/pages/_document.tsx`/`AppLayout`.
  - `BrandMark` no cabeçalho do `AppLayout`.
- [X] T034 [P] Criar os componentes de exibição compostos de shadcn em `src/views/shared/`:
  - `AgentPortrait.tsx`: Avatar + Badge de herói/vilão, imagem do uniforme e nome. Mostra o Badge "indisponível" e imagem em tons de cinza quando `active=false`.
  - `CtpIcon.tsx`: imagem do CTP + Badge de qualidade com a cor do token.
  - `RestrictionBadges.tsx`: lista de critérios ou "Sem restrição".
  - `UpdatedAt.tsx`: data localizada.
  - `EmptyTeam.tsx`: "Sem equipe definida".

**Checkpoint**: `npm run dev` sobe com layout, idioma, tema e login funcionando; `npm test` verde.

---

## Phase 3: User Story 1 - Consultar a equipe Meta do dia (Priority: P1) 🎯 MVP

**Goal**: qualquer visitante vê o dia atual de BAX e BAL (ou o destaque da BAI) e navega até
qualquer dia do ciclo em ≤ 2 interações, vendo restrição, Meta(s), uniformes e CTPs.

**Independent Test**: com `npm run seed:demo`, abrir `/` sem login no viewport de 390 px; ver
BAX e BAL do dia atual; tocar em BAL e depois em um dia; abrir `/bal/livre`. Cenários 1–4 de
`quickstart.md`.

### Tests for User Story 1

- [X] T035 [P] [US1] Escrever os testes de `daysService` em `tests/unit/server/daysService.test.ts`:
  - `listDays("BAX")` retorna 24 dias sem os números 3, 10, 17 e 24, com `weekday` derivado de `WEEKDAYS[(number-1) % 7]`.
  - `getDay("BAX", 3)` gera 404.
  - Um dia sem MetaTeam retorna `metaTeams: []`.
  - O principal vem primeiro.

### Implementation for User Story 1

- [X] T036 [P] [US1] Criar `src/server/repositories/daysRepository.ts` (BattleDay com critérios e MetaTeams com membros → uniforme → agente, e CTP) e `src/server/repositories/metaTeamRepository.ts` (leitura por scope `DAY`/`BAL_FREE`)
- [X] T037 [US1] Implementar `src/server/services/daysService.ts` (`listDays`, `getDay`, `listBalFree`), com saída nos formatos `DaySummary`/`DayDetail` de `contracts/api.md`. Os testes de T035 devem passar
- [X] T038 [US1] Criar `src/pages/api/days/index.ts` (`?mode=BAX|BAL`, validado por Zod), `src/pages/api/days/[mode]/[number].ts` (404 para dias de BAI) e `src/pages/api/bal-free.ts`
- [X] T039 [P] [US1] Criar o cliente `src/models/api/days.ts` (`getDays`, `getDay`, `getBalFree`)
- [X] T040 [P] [US1] Criar `src/viewmodels/useTodayViewModel.ts`, que combina `useBattleClockViewModel` com `getDay` de BAX e BAL do dia atual. Expõe `{ clock, bax, bal, isBaiDay, resetNotice }`, onde `resetNotice` aparece quando `isResetDay && beforeWeeklyReset`
- [X] T041 [P] [US1] Criar `src/viewmodels/useDayViewModel.ts` (`mode`, `number` → dados do dia, `primaryTeam`, `alternatives`, `isEmpty`) e `src/viewmodels/useDayGridViewModel.ts` (lista de dias com destaque do dia atual)
- [X] T042 [US1] Criar a View `src/views/day/MetaTeamCard.tsx`: Card com 3 slots (Solador, Suporte 1, Suporte 2) usando `AgentPortrait` e `CtpIcon`, `UpdatedAt`, label de alternativa e notas
- [X] T043 [US1] Criar a View `src/views/today/TodayView.tsx`: cards BAX e BAL do dia, ou banner da BAI quando `isBaiDay`; Alert do aviso de reset semanal; atalhos para as grades
- [X] T044 [US1] Criar a View `src/views/day/DayGridView.tsx` (grade responsiva de dias com número, dia da semana, `RestrictionBadges` e miniatura do Solador principal; dia atual destacado) e `src/views/day/DayDetailView.tsx` (restrição, Meta principal + alternativas em Tabs, `EmptyTeam`, navegação entre dias anterior/próximo)
- [X] T045 [US1] Criar as páginas `src/pages/index.tsx`, `src/pages/bax/index.tsx`, `src/pages/bal/index.tsx`, `src/pages/bax/[day].tsx`, `src/pages/bal/[day].tsx` e `src/pages/bal/livre.tsx`, cada uma com `getServerSideProps` → `serverSideTranslations`, só montando View + ViewModel
- [X] T046 [P] [US1] Adicionar as traduções `public/locales/{pt-BR,en,es}/days.json` (títulos, aviso de reset, "Dia atual", modo livre, textos de ajuda das telas)
- [X] T047 [US1] Adicionar estados de carregamento (Skeleton) e de erro (Alert com "tentar novamente") em `TodayView`, `DayGridView` e `DayDetailView`

**Checkpoint**: MVP público de consulta funcionando com os dados de demo.

---

## Phase 4: User Story 5 - Curadoria das Metas pela Sword Brazil (Priority: P1)

**Goal**: Curadores e Administradores editam restrições, metas, modo livre, catálogo, imagens,
listas de prioridade, chefes da BAI e configurações. Administradores gerenciam contas e papéis.

**Independent Test**:
- Logar como ADMIN do seed, definir o BAX Dia 6 como "Feminino + Mutante" e tentar publicar uma
  Meta com um agente masculino: deve dar 422.
- Corrigir a Meta e ver a mudança em `/bax/6` com a nova data.
- Logar como USER e abrir `/admin`: o acesso é negado.
- Cenários 11–14 de `quickstart.md`.

### Tests for User Story 5

- [X] T048 [P] [US5] Escrever os testes de `matchesRestriction(agent, criteria)` em `tests/unit/models/restriction.test.ts`: zero critérios = sempre true; um critério; combinação "E" (FEMALE + MUTANT rejeita MALE + MUTANT e FEMALE + HUMAN)
- [X] T049 [P] [US5] Escrever os testes dos schemas de curadoria em `tests/unit/models/schemas.admin.test.ts`:
  - `RestrictionSchema` rejeita atributo repetido e valor inválido para o atributo.
  - `MetaTeamSchema` exige "exatamente 3 membros", slots `SOLO`, `SUPPORT_1` e `SUPPORT_2` únicos e sem agente repetido, `notes ≤ 500`, `battleDayId` "obrigatório se scope = DAY".
  - `CreateStaffSchema` aceita `role: CURATOR|ADMIN` e rejeita e-mail inválido.
  - `BaiBossesSchema` exige `position ≥ 1` única e `tips ≤ 500`.
- [X] T050 [P] [US5] Escrever os testes de `metaTeamService` e `usersService` em `tests/unit/server/curation.test.ts`:
  - Publicar com agente fora da restrição gera 422 `RESTRICTION_VIOLATION`.
  - Publicar com uniforme inativo gera 400.
  - Só 1 `isPrimary` por (scope, battleDayId); marcar outra como principal desmarca a anterior.
  - A publicação grava `updatedById` e `updatedAt`.
  - Rebaixar o último ADMIN gera 409.
  - Um CURATOR alterando papel gera 403.

### Implementation for User Story 5

- [X] T051 [P] [US5] Implementar `matchesRestriction` em `src/models/rules/restriction.ts` (regra "E", conforme `data-model.md`). Os testes de T048 devem passar
- [X] T052 [P] [US5] Criar `src/models/schemas/admin.ts`: `RestrictionSchema`, `MetaTeamSchema`, `PrioritySchema`, `BaiBossesSchema`, `AgentSchema` (`name` 1–80, `slug` kebab-case, uniforms com `name` 1–80), `SettingsSchema` e `CreateStaffSchema`, com os limites de `data-model.md`. Os testes de T049 devem passar
- [X] T053 [US5] Implementar `src/server/services/metaTeamService.ts`:
  - Criar, editar e excluir MetaTeam.
  - Validar uniformes e CTPs ativos e existentes, e a restrição via `matchesRestriction` → 422.
  - Manter a invariante de uma principal por escopo.
  - Gravar o autor.
- [X] T054 [US5] Implementar `src/server/services/restrictionService.ts` (substituir os critérios de um BattleDay), `src/server/services/priorityService.ts` (substituir a lista ordenada; o rank vem da ordem), `src/server/services/baiService.ts` (substituir a sequência de chefes) e `src/server/services/settingsService.ts`
- [X] T055 [US5] Implementar `src/server/services/catalogAdminService.ts`: criar e editar agentes e uniformes; desativar com soft delete (`active=false`, "nunca apagar se houver referências")
- [X] T056 [US5] Implementar `src/server/services/usersService.ts` (listar com busca e paginação, `createStaff` com hash bcrypt e `emailVerifiedAt` preenchido, `changeRole` bloqueando o rebaixamento do último ADMIN com 409, `adminResetPassword`). Os testes de T050 devem passar
- [X] T057 [US5] Criar as API Routes de curadoria (`requireRole("CURATOR")`):
  - `src/pages/api/admin/days/[mode]/[number]/restriction.ts`
  - `src/pages/api/admin/meta-teams/index.ts` e `src/pages/api/admin/meta-teams/[id].ts`
  - `src/pages/api/admin/priority/[...params].ts`
  - `src/pages/api/admin/bai/bosses.ts`
  - `src/pages/api/admin/agents/index.ts` e `src/pages/api/admin/agents/[id].ts`
- [X] T058 [US5] Criar `src/pages/api/admin/assets.ts`: recebe JSON `AssetUploadSchema` {`fileName`, `mimeType`: `image/png`|`image/webp`, `base64`} (schema em `src/models/schemas/admin.ts`). Aceita no máximo "≤ 2 MB" depois de decodificado, com `api.bodyParser.sizeLimit: "3mb"` no `config` da rota. Confere a assinatura do arquivo (magic bytes PNG/WebP), salva em `public/assets/uploads/` com nome slug + hash e retorna `{ imagePath }`. Sem lib nova
- [X] T059 [US5] Criar as API Routes de administração (`requireRole("ADMIN")`): `src/pages/api/admin/users/index.ts`, `src/pages/api/admin/users/[id]/role.ts`, `src/pages/api/admin/users/[id]/reset-password.ts` e `src/pages/api/admin/settings.ts`
- [X] T060 [P] [US5] Criar o cliente `src/models/api/admin.ts` com todas as chamadas das rotas `/api/admin/*`
- [X] T061 [US5] Criar a guarda de página `src/views/admin/AdminGuard.tsx` (`useAuthViewModel`: sem sessão → `/entrar`; papel USER → tela "Acesso negado") e o layout `src/views/admin/AdminLayout.tsx` (Sidebar/Tabs: Dias, Metas, Catálogo, BAI, Usuários, Configurações; as duas últimas só para ADMIN)
- [X] T062 [P] [US5] Criar `src/viewmodels/useAuthViewModel.ts` (`me`, `login`, `logout`, `isCurator`, `isAdmin`) e a página `src/pages/entrar.tsx` com a View `src/views/auth/LoginView.tsx` (Form do shadcn + react-hook-form + `zodResolver(LoginSchema)`)
- [X] T063 [US5] Criar `src/viewmodels/admin/useRestrictionEditorViewModel.ts` e `src/views/admin/RestrictionEditorView.tsx`: tabela dos 24 dias por modo (Tabs BAX/BAL); por dia, um Select por atributo (Gênero, Lado, Espécie, Tipo de ataque, ou "qualquer") combinados com "E"; botão salvar com toast. A página é `src/pages/admin/dias.tsx`
- [X] T064 [US5] Criar `src/viewmodels/admin/useMetaTeamEditorViewModel.ts` e `src/views/admin/MetaTeamEditorView.tsx`:
  - Escolha do escopo (Dia BAX/BAL + número, Modo livre BAL, BAI).
  - 3 slots, cada um com Combobox (Command + Popover) de uniforme filtrado por `matchesRestriction` e Select de CTP (tipo × qualidade).
  - Principal/alternativa, label e notas.
  - Erros 422 mostrados no formulário.
  - Página `src/pages/admin/metas.tsx`.
- [X] T065 [US5] Criar `src/viewmodels/admin/usePriorityEditorViewModel.ts` e `src/views/admin/PriorityEditorView.tsx`: listas ordenáveis de Soladores e Suportes por dia e para a BAI. A ordenação usa `@dnd-kit/core` (já aprovado), com botões subir/descer como alternativa. Fica embutida em `src/pages/admin/metas.tsx` como Tab "Prioridades"
- [X] T066 [US5] Criar `src/viewmodels/admin/useCatalogEditorViewModel.ts` e `src/views/admin/CatalogEditorView.tsx`:
  - Tabela de agentes com busca e Dialog de edição de agente e uniformes.
  - Upload de imagem via `/api/admin/assets`.
  - Ação "desativar".
  - Página `src/pages/admin/catalogo.tsx`.
- [X] T067 [US5] Criar `src/viewmodels/admin/useBaiEditorViewModel.ts` e `src/views/admin/BaiEditorView.tsx` (sequência de chefes: nome, imagem e dicas, "≤ 500 caracteres", reordenáveis) e a página `src/pages/admin/bai.tsx`
- [X] T068 [US5] Criar `src/viewmodels/admin/useUsersAdminViewModel.ts` e `src/views/admin/UsersAdminView.tsx`:
  - Tabela com busca.
  - Dialog "Novo administrador/curador" com Form + `zodResolver(CreateStaffSchema)`.
  - Troca de papel com AlertDialog de confirmação.
  - Redefinir senha.
  - Página `src/pages/admin/usuarios.tsx`.
- [X] T069 [US5] Criar `src/viewmodels/admin/useSettingsViewModel.ts` e `src/views/admin/SettingsView.tsx` (âncora do ciclo como data/hora BRT, horas de virada e reset, dia da BAI), mais as páginas `src/pages/admin/config.tsx` e `src/pages/admin/index.tsx` (resumo e atalhos)
- [X] T070 [P] [US5] Adicionar as traduções `public/locales/{pt-BR,en,es}/admin.json` e `auth.json`
- [X] T071 [US5] Criar o script de importação de imagens `scripts/import-assets.ts` + `scripts/assets-manifest.json` (lista `{ url, dest }`, com os 21 CTPs inicialmente) e o script `npm run assets:import`:
  - Usa o `fetch` nativo, espera 500 ms entre downloads e não sobrescreve arquivos existentes sem `--force`.
  - Salva em `public/assets/ctp/` e `public/assets/agents/<agente>/<uniforme>.png`.
  - Recusa rodar com `NODE_ENV=production`.

**Checkpoint**: curadoria completa; o conteúdo real substitui o de demo sem mexer no código.

---

## Phase 5: User Story 2 - Marcar meus agentes e uniformes por dia (Priority: P2)

**Goal**:
- O usuário marca o elenco que possui e monta sua equipe por dia, filtrada pela restrição.
- Vê a comparação com a Meta e uma sugestão automática.
- Salva no aparelho, com backup, e sincroniza opcionalmente com uma conta.

**Independent Test**:
- Marcar o elenco em `/meu-elenco`.
- Em `/bax/4` ("Vilão"), ver só vilões possuídos, montar a equipe, ver a comparação e a sugestão.
- Recarregar: a equipe continua lá.
- Exportar e importar o backup.
- Logar com o USER do seed em dois navegadores e ver as mesmas seleções.
- Cenários 7, 9, 10, 15 e 16 de `quickstart.md`.

### Tests for User Story 2

- [X] T072 [P] [US2] Escrever os testes de `compareWithMeta(userTeam, metaTeam, roster)` em `tests/unit/models/compare.test.ts`: os status `MATCH`, `DIFFERENT`, `NOT_OWNED`, `UNIFORM_NOT_OWNED` e `CTP_DIFFERENT` por slot, e equipe vazia
- [X] T073 [P] [US2] Escrever os testes de `suggestTeam(roster, priorityEntries, criteria)` em `tests/unit/models/suggest.test.ts`:
  - Escolhe o Solador possuído de menor rank que atende à restrição.
  - Depois escolhe 2 Suportes distintos, sem repetir o Solador.
  - Retorna `null` se não houver nenhum agente válido.
  - Não sugere um uniforme não possuído.
- [X] T074 [P] [US2] Escrever os testes de `UserSelectionsSchema` e `mergeDecision(local, remote)` em `tests/unit/models/selections.test.ts`:
  - `version: 1`.
  - Chaves de time `BAX-<n>`, `BAL-<n>` e `BAI`, rejeitando dias de BAI em BAX/BAL.
  - Rejeita o mesmo agente em dois slots.
  - `mergeDecision` retorna `UPLOAD_LOCAL`, `USE_REMOTE`, `ASK_USER` ou `IN_SYNC`.
- [X] T075 [P] [US2] Escrever os testes de `selectionsService` e do fluxo de cadastro e recuperação em `tests/unit/server/selections.test.ts`:
  - PUT com `baseUpdatedAt` divergente gera 409.
  - `register` com e-mail existente dá a mesma resposta que um e-mail novo.
  - Token de reset expira em "1 h", o de verificação em "24 h", e ambos são de uso único.

### Implementation for User Story 2

- [X] T076 [P] [US2] Implementar `compareWithMeta` em `src/models/rules/compare.ts` e `suggestTeam` em `src/models/rules/suggest.ts`, conforme `data-model.md`. Os testes de T072 e T073 devem passar
- [X] T077 [P] [US2] Criar `src/models/schemas/selections.ts` (`UserSelectionsSchema` com o formato de `data-model.md`) e `src/models/rules/selectionsSync.ts` (`mergeDecision`). Os testes de T074 devem passar
- [X] T078 [P] [US2] Criar a store Zustand com `persist` (chave `mff-selections`, `version: 1`) em `src/viewmodels/stores/selectionsStore.ts`:
  - Ações: `toggleOwnedUniform`, `setSlot(teamKey, slot, uniformId)`, `clearSlot`, `resetMode(mode)`, `replaceAll(doc)`.
  - Invariante: o mesmo agente não pode estar em dois slots.
- [X] T079 [US2] Estender `daysService`/`getDay` para incluir `priority: { solo[], support[] }` em `DayDetail` (leitura de PriorityEntry), atualizando `src/server/services/daysService.ts` e `src/models/api/days.ts`
- [X] T080 [US2] Implementar `src/server/services/mailService.ts` (interface `MailService` + implementação `ConsoleMailService`, que escreve os links no log do servidor) e estender `src/server/services/authService.ts` com `register`, `verifyEmail`, `forgotPassword` e `resetPassword`:
  - `AuthToken` guarda só o hash do token.
  - Expiração: verify "24 h", reset "1 h"; uso único.
  - Respostas não revelam se o e-mail existe.
- [X] T081 [US2] Criar as API Routes `src/pages/api/auth/register.ts`, `verify-email.ts`, `forgot-password.ts` e `reset-password.ts` (schemas `RegisterSchema` e `ResetPasswordSchema` em `src/models/schemas/auth.ts`)
- [X] T082 [US2] Implementar `src/server/services/selectionsService.ts` (get/put de `UserSelectionsDoc`, 409 se `baseUpdatedAt` divergir) e a API Route `src/pages/api/me/selections.ts` (`requireUser`). Os testes de T075 devem passar
- [X] T083 [US2] Criar `src/viewmodels/useSelectionsSyncViewModel.ts`:
  - Após o login, aplica `mergeDecision`: `UPLOAD_LOCAL` automático, `ASK_USER` abre um AlertDialog "manter do aparelho / manter da conta".
  - Envia as mudanças com debounce de 2 s quando logado.
  - Nada é descartado sem confirmação.
- [X] T084 [US2] Criar `src/viewmodels/useRosterViewModel.ts` e `src/views/roster/RosterView.tsx` + página `src/pages/meu-elenco.tsx`:
  - Busca por nome e filtros por gênero, lado, espécie e tipo de ataque (ToggleGroup).
  - Grade de agentes com uniformes marcáveis.
  - Contador de possuídos.
  - Exportar/importar backup em JSON validado por `UserSelectionsSchema`, com erro amigável se for inválido.
- [X] T085 [US2] Criar `src/viewmodels/useTeamBuilderViewModel.ts`:
  - Para um `teamKey`, lista os candidatos possuídos que atendem a `matchesRestriction`.
  - Expõe `setSlot`/`clearSlot`, `comparison = compareWithMeta(...)` e `suggestion = suggestTeam(...)`.
  - Ação `applySuggestion`.
- [X] T086 [US2] Criar a View `src/views/day/MyTeamPanel.tsx`, incluída em `DayDetailView`:
  - 3 slots com Combobox de candidatos.
  - Badges de comparação por slot, com legenda de cores e `HelpHint`.
  - Card "Sugestão para seu elenco" com "Aplicar".
  - Mensagem orientando a marcar o elenco quando não há candidatos.
- [X] T087 [US2] Criar as páginas e Views de auth restantes:
  - `src/pages/cadastro.tsx`, `recuperar-senha.tsx`, `redefinir-senha.tsx` e `verificar-email.tsx`.
  - `src/views/auth/{RegisterView,ForgotPasswordView,ResetPasswordView,VerifyEmailView}.tsx`, com Form + zodResolver.
  - Na tela de login, a mensagem 429 de bloqueio temporário.
- [X] T088 [US2] Adicionar a ação "Redefinir seleções" por modo (BAX/BAL/BAI) com AlertDialog de confirmação em `src/views/roster/RosterView.tsx`, chamando `resetMode`
- [X] T089 [P] [US2] Adicionar as traduções `public/locales/{pt-BR,en,es}/roster.json` e as chaves de comparação, sugestão e sincronização em `days.json` e `auth.json`

**Checkpoint**: planejamento pessoal completo, local e sincronizado.

---

## Phase 6: User Story 3 - Atribuir CTPs com arrastar e soltar (Priority: P2)

**Goal**:
- Uma paleta com 7 CTPs × 3 qualidades.
- Arrastar e soltar (ponteiro, toque e teclado) sobre os slots da equipe do usuário.
- Alternativa "tocar no CTP e depois no agente".
- Um CTP por slot, remoção e comparação com o CTP Meta.

**Independent Test**:
- Em `/bax/4`, com a equipe montada, arrastar "Fúria Brilhante" para o Solador.
- Soltar "Liberação Poderoso" para substituir.
- Remover.
- Repetir por toque e por teclado.
- Recarregar e ver o CTP persistido; a divergência com a Meta aparece sinalizada.
- Cenário 8 de `quickstart.md`.

### Tests for User Story 3

- [X] T090 [P] [US3] Escrever os testes do reducer puro `applyCtp(team, slot, ctpId | null)` em `tests/unit/models/ctpAssign.test.ts`: atribuir, substituir ("um CTP por agente por equipe"), remover (`null`), slot sem agente não aceita CTP

### Implementation for User Story 3

- [X] T091 [P] [US3] Implementar `applyCtp` em `src/models/rules/ctpAssign.ts` e expor `setCtp(teamKey, slot, ctpId|null)` em `src/viewmodels/stores/selectionsStore.ts`. Os testes de T090 devem passar
- [X] T092 [US3] Estender `src/viewmodels/useTeamBuilderViewModel.ts` com:
  - `armedCtp` (CTP selecionado por toque) e `armCtp(ctpId)`.
  - `dropCtp(slot, ctpId)` e `tapSlot(slot)`, que aplica o `armedCtp`.
  - `removeCtp(slot)` e `ctpComparison` por slot.
  - Um comando único usado por drag, toque e teclado.
- [X] T093 [US3] Criar a View `src/views/day/CtpPalette.tsx`: grade de `CtpIcon` agrupada por tipo (Fúria, Liberação, Percepção, Competição, Julgamento, Salto, Autoridade) × qualidade (Normal, Poderoso, Brilhante). Cada item é `useDraggable` (@dnd-kit/core) e também é clicável para "armar". Em telas < 768 px vira Sheet inferior
- [X] T094 [US3] Integrar `DndContext` (sensores `PointerSensor`, `TouchSensor` e `KeyboardSensor`) em `src/views/day/MyTeamPanel.tsx`:
  - Cada slot é `useDroppable` e mostra o CTP atribuído com o botão "remover CTP".
  - Soltar fora de um alvo válido não altera nada.
  - Highlight dos alvos durante o arraste e quando há CTP armado.
- [X] T095 [P] [US3] Adicionar as traduções e o texto de ajuda do arrastar e soltar (`HelpHint`) em `public/locales/{pt-BR,en,es}/days.json` e anúncios de acessibilidade do @dnd-kit (`announcements`) traduzidos

**Checkpoint**: US2 + US3 entregam o planejador completo da equipe.

---

## Phase 7: User Story 4 - Consultar a BAI (Priority: P3)

**Goal**: seção BAI sempre acessível, com explicação, sequência de chefes, equipes recomendadas e
sugestão com o elenco do usuário. Destaque como "Hoje" no dia de BAI (12:00–12:00 BRT) e contagem
para a próxima BAI nos outros dias.

**Independent Test**:
- Com chefes e equipe BAI cadastrados, abrir `/bai` no Dia 2: ver o conteúdo e a data de início
  da próxima BAI.
- Ajustar `Settings.cycleAnchor` para que hoje seja o dia 3: `/` destaca a BAI e `/bax` não
  lista os dias 3, 10, 17 e 24.

### Tests for User Story 4

- [X] T096 [P] [US4] Escrever os testes de `baiService.getPublic` em `tests/unit/server/baiService.test.ts`: chefes ordenados por `position`, metaTeams de scope `BAI` com a principal primeiro, `priority` da BAI e `nextStart` vindo de `getBattleClock`

### Implementation for User Story 4

- [X] T097 [US4] Implementar `getPublic` em `src/server/services/baiService.ts` e a API Route `src/pages/api/bai.ts` (public). Os testes de T096 devem passar
- [X] T098 [P] [US4] Criar o cliente `src/models/api/bai.ts` e `src/viewmodels/useBaiViewModel.ts` (`bosses`, `metaTeams`, `isToday`, `countdown` atualizado a cada minuto, `suggestion` via `suggestTeam` com critérios vazios e elenco do usuário, `teamKey = "BAI"` para o TeamBuilder)
- [X] T099 [US4] Criar a View `src/views/bai/BaiView.tsx`:
  - Explicação do modo (texto do i18n).
  - Timeline dos chefes em ordem: Card com imagem, nome e dicas.
  - `MetaTeamCard`(s) e `MyTeamPanel` com `teamKey="BAI"` e sem restrição.
  - Badge "Hoje" ou contagem regressiva.
  - Página `src/pages/bai.tsx`.
- [X] T100 [US4] Integrar a BAI na tela inicial: em `src/views/today/TodayView.tsx`, quando `isBaiDay`, mostrar o resumo da BAI (chefes + equipe principal) no lugar dos cards BAX/BAL; nos outros dias, um card compacto com a contagem para a próxima BAI
- [X] T101 [P] [US4] Adicionar as traduções `public/locales/{pt-BR,en,es}/bai.json` (explicação do modo, "Hoje", contagem, ajuda)

**Checkpoint**: todas as user stories funcionais.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T102 [P] Exportar imagem (FR-022): criar `src/viewmodels/useExportImageViewModel.ts` (html-to-image `toPng` de um `ref`, nome `mff-<teamKey>-<data>.png`) e adicionar o botão "Exportar imagem" em `MetaTeamCard`, `MyTeamPanel` e `DayGridView`
- [X] T103 [P] Revisar mobile-first em 360/390/768/1280 px: sem scroll horizontal; alvos de toque ≥ 44 px; qualquer dia alcançável em 2 interações a partir de `/` (FR-004, SC-002). Ajustar `src/views/**`
- [X] T104 [P] Revisar acessibilidade: contraste dos tokens MFF nos temas claro e escuro, `alt` em todas as imagens de agente e CTP, foco visível e operação do drag and drop por teclado. Ajustar `src/styles/globals.css` e as Views
- [X] T105 [P] Conferir que todas as chaves existem nos 3 idiomas: criar `scripts/check-locales.ts` (compara as chaves de `public/locales/*`) e o script `npm run check:locales`
- [X] T106 Segurança:
  - Conferir que toda rota `src/pages/api/admin/**` usa `requireRole` e toda rota de escrita valida com Zod.
  - Conferir que nenhuma resposta inclui `passwordHash`/`tokenHash`.
  - `SESSION_SECRET` ausente deve impedir o start, com erro claro em `src/server/session.ts`.
- [X] T107 [P] Otimizar imagens com `next/image` (sizes, lazy) em `AgentPortrait` e `CtpIcon`; garantir SC-001 (Meta do dia em ≤ 5 s no celular com CPU 4x mais lenta no DevTools)
- [X] T108 [P] Criar `README.md` na raiz: setup (`quickstart.md`), comandos (`dev`, `test`, `seed`, `seed:demo`, `assets:import`, `check:locales`), backup (copiar `prisma/dev.db`), aviso de projeto de fã e regra "libs novas só com autorização"
- [X] T109 Rodar `npm test`, `npm run check:locales` e `npm run build`, e executar os 18 cenários de `specs/001-alliance-battle-metas/quickstart.md`, registrando o resultado

---

## Phase 9: Ajustes de 2026-10-18 (tela central, CTP por personagem, gráficos, importação)

- [X] T110 Importar o Guia BAX/BAL/BAI: snapshot `prisma/data/guiabaxbal-2026-10-18.json`, conversão pura `src/models/import/guiabaxbal.ts` (tokens de restrição, Meta/Alternativa, BAI, dedução de atributos com "não informado") com testes em `tests/unit/models/guiabaxbal.test.ts`, e `scripts/import-guiabaxbal.ts` (`npm run import:guiabaxbal`)
- [X] T111 Atributo "não informado" (`UNKNOWN`) que não bloqueia `matchesRestriction`; CTP da Meta opcional (migração `meta_ctp_optional`)
- [X] T112 CTP equipado por personagem: `equipment.ctpByAgent` em `UserSelectionsSchema`, `equipCtp` em `src/models/rules/ctpAssign.ts` e na store; comparação com a Meta usa o CTP do personagem
- [X] T113 Endpoint `/api/cycle` (`src/server/services/cycleService.ts`) com os 28 dias, BAX/BAL por dia e a BAI, com teste
- [X] T114 Tela central `src/views/cycle/CycleView.tsx` + `useCycleViewModel`: dias com BAX e BAL lado a lado, BAI no dia inteiro, Meta e Alternativa, dia atual destacado com rolagem automática, filtro por semana; remover as telas Hoje/BAX/BAL/BAI e redirecionar as rotas antigas
- [X] T115 Montagem da equipe do usuário em diálogo (`TeamBuilderPanel`): elenco, copiar Meta/Alternativa, sugestão, CTPs por arrastar/tocar
- [X] T116 Responsividade dos CTPs: `CtpBadge` (ícone com tooltip), `MemberChip` e `TeamStrip` compactos, paleta só com ícones; cabeçalho móvel com idioma/tema no menu
- [X] T117 "Meu elenco": equipar CTP em cada personagem possuído (paleta + arrastar/tocar)
- [X] T118 Página `/estatisticas` (`src/models/rules/stats.ts` + testes): repetição de personagens por semana (empilhado, Meta ± Alternativas, por modo) e CTPs equipados por tipo/qualidade, cada um com vista em tabela; recharts via shadcn Chart; paleta validada para daltonismo
- [X] T119 Crédito ao Guia BAX/BAL/BAI no rodapé; rótulos Líder / Pos. 1 / Pos. 2

---

## Phase 10: Ajustes de 2026-10-18 (modal, dia atual, imagens)

- [X] T120 Modal "Minha equipe" responsivo: tela cheia no celular com paleta de CTPs fixa embaixo (rolagem horizontal); até 72rem em duas colunas no notebook/PC (o `sm:max-w-sm` padrão do Dialog limitava a largura); posições em linhas largas
- [X] T121 Sinalização do dia atual: faixa com os 28 dias (hoje destacado, toque leva ao dia), aviso "Você está aqui" com contagem até a virada das 12h; link direto `/?montar=BAX-4`
- [X] T122 Imagens de `img/`: manifesto `prisma/data/images.json` (73 retratos → personagem/traje, 5 CTPs, ícones de restrição) e `scripts/import-images.ts` (`npm run import:images`); retrato do personagem como reserva para trajes sem foto (`Uniform.portrait`); ícones nos selos de restrição

---

## Phase 11: Ajustes de 2026-10-18 (fotos, CTPs, arrastar e soltar, elenco)

- [X] T123 Corrigir as fotos trocadas de Crystal (Canção-X ← `dazzler`) e Crystalys (Mulher da Primavera ← `crystal3`); `import:images` limpa antes as fotos que ele mesmo ligou
- [X] T124 Remover o CTP de Autoridade (enum, traduções, manifesto, banco); 6 tipos × 3 qualidades
- [X] T125 Cores de CTP (`src/models/domain/ctpColors.ts`): 18 cores distintas (testadas); personagem com CTP equipado "pintado" com a cor (montagem, elenco e "Minha equipe")
- [X] T126 Animação do arrastar e soltar (`CtpDragOverlay`): ícone segue o ponteiro com brilho e "assenta" ao soltar; alvos válidos pulsam; alvo sob o ponteiro cresce; CTP equipado entra com zoom
- [X] T127 Seletor de personagens com foto do traje (ou iniciais)
- [X] T128 "Meu elenco": esconder o traje Padrão de personagens jogados com traje (Padrão fora de todas as equipes e com outros trajes)

---

## Phase 12: Ajustes de 2026-10-18 (restrições, trajes, celular, metas, estatísticas)

- [X] T129 Restrições dos dias conferidas com a lista oficial (paralisar = BAX, choque = BAL); BAL 13 → Vilão + Mutante, com Meta/Alternativa da BAX 14
- [X] T130 Atributos por traje (gênero, lado, espécie, tipo de ataque; vazio = herda do personagem) em badges no catálogo; restrições checadas pelo traje; importador deduz atributos por traje
- [X] T131 Admin no celular: menu de seções visível, catálogo/restrições/usuários em listas e cartões, diálogos em tela cheia com rodapé fixo
- [X] T132 CTP no celular: gaveta `CtpPicker` com os 18 CTPs (elenco, "Minha equipe", metas e reservas); filtros do elenco recolhíveis
- [X] T133 CTPs (admin): sem o campo Tipo; adicionar pelo grupo do tipo, só qualidades livres
- [X] T134 Metas (admin): quadro do ciclo inteiro (BAX e BAL lado a lado, filtros por semana e modo) com edição no próprio dia
- [X] T135 Sugestão = Meta → Alternativas → reservas, gerada na hora; aba Prioridades substituída por "Reservas" por dia/BAI
- [X] T136 Traduções sempre mescladas na navegação (textos novos não ficam como chave crua)
- [X] T137 Estatísticas: gráfico alterna Metas / Minhas equipes; lista de todas as equipes do usuário agrupadas pelas que mais se repetem
- [X] T138 Tela 404, componentes de "em desenvolvimento" (toast, selo e página) e aviso de Metas atualizadas (toast + selo no dia e no modo) — FR-031 a FR-034

---

## Phase 13: Padrão de notificações de segurança (FN-001 a FN-004)

- [X] T139 Catálogo de eventos de segurança com gravidade fixa (informativo / atenção / crítico) e o canal de cada um, em `src/models/domain` (FN-002)
- [X] T140 Ponto único `notify(evento)` (padrão Notification) que despacha para os 3 canais, com testes da escolha de canal (FN-001, FN-002)
- [X] T141 Canal "atenção": aviso persistente na tela (faixa dispensável) para e-mail não confirmado, papel alterado, login em outro aparelho e tentativas falhas (FN-001)
- [X] T142 Canal "crítico": e-mails de segurança pelo `MailService` (senha redefinida, papel alterado, conta bloqueada) + aviso persistente (FN-001, FN-004)
- [X] T143 Ligar os eventos existentes (login, bloqueio, redefinição de senha, troca de papel) ao `notify`, nos 3 idiomas, sem expor dados sensíveis (FN-003)

---

## Phase 14: Rotação do Líder nas equipes Meta/Alternativa (FR-035)

- [X] T144 Regra `parseRotation`/`formatRotation` (1–6, c/dc/qc, grupos opcionais) com testes
- [X] T145 Campos `isDamageDealer`/`rotation`/`rotationNotes` em `MetaTeamMember` (migração leva a rotação antiga para o Líder; schema Zod; serviço normaliza)
- [X] T146 Editor de equipe (admin): interruptor "Causador de Dano" em cada posição e rotação com prévia ao vivo, erros explicados e legenda
- [X] T147 Visão pública: selo de Causador de Dano e botão "Rotação" no TeamStrip com a rotação de cada um (ciclo, BAI, BAL livre e quadro do admin)
- [X] T149 Posições Esquerda · Líder · Direita (antes Pos. 1 / Pos. 2), Líder no meio e em destaque em todas as telas (FR-036)
- [X] T150 Atributos (gênero, lado, espécie, ataque) só no traje: removidos do personagem (migração copia para os trajes); editor de catálogo, importador, elenco e selo herói/vilão pelo traje
- [X] T151 Vídeo de referência da rotação (YouTube sem cookies ou .mp4/.webm externo), mudo e em loop, carregado só ao abrir o painel
- [X] T152 Rotações por personagem/traje (aba "Rotações" no admin, texto livre, descrição e vídeo); equipe só marca o Causador de Dano; foto do Causador de Dano leva a `/rotacoes/[personagem]` (por traje, com prévia); `/rotacoes` lista os personagens
- [X] T153 Cores fixas por modo, como no jogo: BAX azul, BAL laranja, BAI vermelho (tokens `bax`/`bal`/`bai`, temas claro e escuro) no ciclo, faixa de dias, montador, BAL livre, admin e estatísticas
- [ ] T148 Rotações de exemplo pré-cadastradas a partir de vídeos de jogadores experientes (aguarda as fontes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do Setup e bloqueia todas as stories. T014 depende de
  T013; T017 depende de T015; T022 depende de T021; T030 depende de T027–T029. T006 só é validado depois de T015 (migrações), antes de T021.
- **US1 (Phase 3)**: depende da Phase 2. Usa `seed:demo` (T018) para ser testável sem a US5.
- **US5 (Phase 4)**: depende da Phase 2. Independente da US1 (valida pela API e pelo admin),
  mas reaproveita `MetaTeamCard` (T042) para pré-visualização, se disponível.
- **US2 (Phase 5)**: depende da Phase 2 e reaproveita `DayDetailView` da US1 (T044).
  `suggestTeam` usa listas de prioridade (criadas na US5 ou via seed).
- **US3 (Phase 6)**: depende da US2 (`MyTeamPanel`, `selectionsStore`).
- **US4 (Phase 7)**: depende da Phase 2. Reaproveita `MetaTeamCard` (US1) e `MyTeamPanel`
  (US2/US3) para a parte "minha equipe". A exibição pública funciona só com a US1.
- **Polish (Phase 8)**: depois das stories desejadas.

### User Story Dependencies (grafo)

```text
Setup → Foundational ─┬─> US1 (MVP) ─┬─> US2 ─> US3
                      │              └─> US4 (equipe pessoal da BAI usa US2/US3)
                      └─> US5 (curadoria; independente)
```

### Within Each User Story

- Testes (Vitest) primeiro, falhando, depois rules/schemas, services, API Routes, ViewModels,
  Views e páginas.
- Views não contêm regra de negócio: toda lógica fica em `src/models/rules` ou no ViewModel.

---

## Parallel Opportunities

- Setup: T005, T007 e T008 em paralelo após T004.
- Foundational: T009–T013, T016, T019–T021, T024, T026, T031 e T033 são [P].
- US1: T035, T036, T039, T040, T041 e T046 em paralelo.
- US5: T048–T052, T060, T062 e T070 em paralelo. As Views de admin (T063–T069) são arquivos
  distintos e podem ser divididas entre desenvolvedores após T057–T061.
- US2: T072–T078 em paralelo.
- Polish: quase tudo é [P].
- Depois da Phase 2, US1 e US5 podem andar em paralelo.

## Parallel Example: User Story 1

```bash
Task: "T035 Testes de daysService em tests/unit/server/daysService.test.ts"
Task: "T036 Repositórios de dias e metas em src/server/repositories/"
Task: "T039 Cliente src/models/api/days.ts"
Task: "T040 useTodayViewModel em src/viewmodels/useTodayViewModel.ts"
Task: "T041 useDayViewModel/useDayGridViewModel em src/viewmodels/"
Task: "T046 Traduções public/locales/*/days.json"
```

## Parallel Example: User Story 5

```bash
Task: "T048 Testes de matchesRestriction em tests/unit/models/restriction.test.ts"
Task: "T049 Testes dos schemas de admin em tests/unit/models/schemas.admin.test.ts"
Task: "T050 Testes de curadoria em tests/unit/server/curation.test.ts"
Task: "T051 matchesRestriction em src/models/rules/restriction.ts"
Task: "T052 Schemas de admin em src/models/schemas/admin.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) e Phase 2 (Foundational).
2. Phase 3 (US1) com `npm run seed:demo`.
3. **Parar e validar** os cenários 1–6 do quickstart: consulta pública com idioma e tema.

### Incremental Delivery

1. MVP (US1): consulta das metas.
2. US5: a Sword Brazil passa a cadastrar o conteúdo real, incluindo a lista de restrições
   editada manualmente em `/admin/dias`.
3. US2: elenco, equipe pessoal, sugestão, contas e sincronização.
4. US3: CTPs com arrastar e soltar.
5. US4: BAI completa.
6. Polish.

### Notes

- Antes de instalar qualquer lib fora de `research.md`, pedir autorização. Pendentes conhecidas:
  `jsdom` + `@testing-library/react` (testes de ViewModel) e `nodemailer` (e-mail real, quando
  houver hospedagem).
- Commitar após cada tarefa ou grupo lógico; validar cada checkpoint.
