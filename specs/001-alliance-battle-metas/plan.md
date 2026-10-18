# Implementation Plan: Plataforma de Metas da Batalha de Aliança (Sword Brazil)

**Branch**: `001-alliance-battle-metas` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-alliance-battle-metas/spec.md`

## Summary

Plataforma web para os membros da Sword Brazil:
- Consultar a equipe Meta de cada dia de BAX e BAL (ciclo de 28 dias, sem os dias de BAI), o modo
  livre da BAL e a BAI.
- Montar a própria equipe a partir do elenco que possuem, atribuir CTPs arrastando e soltando e
  receber sugestões baseadas em listas de prioridade dos curadores.

Abordagem técnica:
- Next.js **Pages Router** com API Routes no mesmo projeto e **SQLite + Prisma** local, sem
  nuvem.
- UI 100% **shadcn/ui** (+ Origin UI e Magic UI) restilizada com tokens Tailwind v4 numa
  identidade "MFF/MCU".
- **next-i18next** (PT-BR/EN/ES), **next-themes**, arquitetura **MVVM**: Model puro + ViewModels
  em hooks com TanStack Query e Zustand.
- Admins e curadores editam restrições, metas, catálogo e contas pela aba Admin.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS

**Primary Dependencies**:
- Next.js (Pages Router), React, Tailwind CSS v4.
- shadcn/ui (+ Origin UI, Magic UI via registry).
- next-i18next, next-themes, Zod, react-hook-form + @hookform/resolvers, lucide-react.
- @dnd-kit/core, @tanstack/react-query, zustand, html-to-image.
- Prisma (SQLite), bcryptjs, iron-session.
- Lista completa e status de autorização em [research.md](./research.md#resumo-de-dependências).

**Storage**:
- SQLite em arquivo (`prisma/dev.db`) para catálogo, metas, restrições, usuários e seleções
  sincronizadas.
- `localStorage` (Zustand persist) para as seleções no aparelho.
- `public/assets/` para as imagens.

**Testing**: Vitest para o Model e os ViewModels (autorizado em 2026-10-17, research R13). Os
cenários manuais estão em [quickstart.md](./quickstart.md).

**Target Platform**: navegadores modernos, mobile-first (≥ 360 px). Servidor Node local; deploy
futuro exige host com disco persistente.

**Project Type**: aplicação web full-stack (Next.js monolito)

**Performance Goals**: Meta do dia visível em ≤ 5 s no celular (SC-001). Catálogo servido com
cache. Atualização do relógio a cada 60 s no cliente.

**Constraints**:
- Sem serviço em nuvem nem pago.
- Nenhum componente visual criado do zero.
- Nenhuma lib fora da lista aprovada sem autorização do usuário.
- Horário de Brasília para todo o calendário.

**Scale/Scope**:
- Aliança de ~30 membros, mais acesso público.
- Catálogo de ~300 agentes e ~1.000 uniformes.
- 48 dias de BAX/BAL, 18 CTPs (6 tipos × 3 qualidades; Autoridade removida em 2026-10-18).
- ~15 telas públicas e ~7 telas de admin.

## Constitution Check

Referência: Constituição **v1.1.0** (emendada em 2026-10-17).

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|-----------|-------------|--------|
| I. Fidelidade ao domínio MFF | Termos BAX/BAL/BAI/Agente/CTP/Meta canônicos no Model e no i18n (não traduzidos). Os 7 CTPs × 3 qualidades fixados no seed | ✅ |
| II. Dia como unidade central | Ciclo de 28 dias com dias de BAI (3, 10, 17, 24) fora de BAX/BAL. `BattleDay` (mode, number) com restrição e Meta por dia. Modo livre da BAL em escopo próprio (`BAL_FREE`). Dias vazios mostram "Sem equipe definida" | ✅ |
| III. Feito para a Sword Brazil | PT-BR é o idioma padrão e sempre completo; EN/ES permitidos; termos do jogo não traduzidos. Logo, nome e favicon da Sword Brazil (T033) | ✅ |
| IV. Conteúdo curado, datado, separado do código | Todo o conteúdo fica no SQLite e é editado pela aba Admin. `updatedAt`/`updatedById` são exibidos. Validação Zod + regra de restrição antes de publicar | ✅ |
| V. Consulta rápida e mobile-first | Rota `/` mostra o dia atual. Qualquer dia em 2 interações (aba → dia). Imagens de agentes e CTPs | ✅ |
| VI. Simplicidade (YAGNI) | Monolito Next.js, SQLite sem servidor, libs mínimas e aprovadas. Sem rankings, chat ou simulador | ✅ |
| Restrição: aviso de fã, sem credenciais do jogo | Rodapé com aviso. Nenhuma integração com contas do jogo | ✅ |
| Restrição: dados pessoais mínimos | Conta opcional de jogador e obrigatória para staff: só e-mail, hash bcrypt e apelido opcional | ✅ |
| Fluxo: testes automatizados das regras de domínio | Vitest (autorizado) para calendário, restrição, sugestão e schemas | ✅ |

**Gate result**: PASS. A única justificativa restante é o envio de e-mail adiado (#1 abaixo).

**Re-check pós-design (Phase 1)**: data-model, contracts e quickstart mantêm as mesmas conclusões.
Nenhuma nova violação foi introduzida.

## Project Structure

### Documentation (this feature)

```text
specs/001-alliance-battle-metas/
├── plan.md              # Este arquivo
├── research.md          # Phase 0: decisões e libs
├── data-model.md        # Phase 1: entidades, regras, estados
├── quickstart.md        # Phase 1: setup e cenários de validação
├── contracts/
│   └── api.md           # Phase 1: API Routes + rotas de UI
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma               # Modelos do data-model.md (SQLite)
├── migrations/
└── seed.ts                     # CTPs, BattleDays, Settings, contas ADMIN + USER (via .env.local)

public/
├── assets/ctp/                 # PNGs sem fundo dos CTPs
├── assets/agents/<agente>/     # <uniforme>.png
└── locales/{pt-BR,en,es}/      # JSON do next-i18next (common, days, admin, ...)

scripts/
└── import-assets.ts            # baixa imagens do manifesto para public/assets

src/
├── models/                     # M: domínio puro, sem React
│   ├── domain/                 # tipos e enums (Mode, CtpType, Slot, ...)
│   ├── schemas/                # Zod compartilhado cliente/servidor
│   ├── rules/                  # battleClock, restriction, compare, suggest
│   └── api/                    # clientes fetch tipados das API Routes
├── viewmodels/                 # VM: hooks use*ViewModel (TanStack Query + Zustand)
│   ├── stores/                 # Zustand persist: selections, ui
│   ├── useTodayViewModel.ts
│   ├── useDayViewModel.ts
│   ├── useRosterViewModel.ts
│   ├── useTeamBuilderViewModel.ts   # CTP drag/drop + toque
│   ├── useBaiViewModel.ts
│   ├── useAuthViewModel.ts
│   └── admin/                  # useRestrictionEditorVM, useMetaTeamEditorVM, useUsersVM, ...
├── views/                      # V: composições de componentes, sem regra de negócio
│   ├── today/  day/  roster/  bai/  auth/  admin/  layout/
├── components/
│   ├── ui/                     # shadcn/ui (gerado pela CLI, só restilizado)
│   ├── origin/  magic/         # componentes vindos dos registries
├── server/                     # só servidor (API Routes)
│   ├── db.ts                   # Prisma client
│   ├── session.ts              # iron-session + guards requireRole()
│   ├── repositories/           # acesso Prisma por agregado
│   ├── services/               # catalog, days, metaTeams, auth, users, selections, mail(console)
│   └── http.ts                 # validação Zod e formato de erro padrão
├── pages/
│   ├── _app.tsx                # QueryClientProvider, ThemeProvider, appWithTranslation
│   ├── index.tsx  bax/  bal/  bai.tsx  meu-elenco.tsx  entrar.tsx ... admin/
│   └── api/                    # rotas do contracts/api.md (finas: validam → service)
└── styles/
    └── globals.css             # Tailwind v4 @theme: tokens MFF/MCU (claro/escuro)

tests/
├── unit/models/                # battleClock, restriction, compare, suggest, schemas
└── unit/viewmodels/
```

**Structure Decision**:
- Monolito Next.js (Pages Router) com MVVM explícito:
  - `src/models` (Model)
  - `src/viewmodels` (ViewModel)
  - `src/views` + `src/pages` (View)
- As páginas só montam a View com o ViewModel correspondente.
- O backend fica em `src/pages/api` delegando a `src/server/services`.
- Os schemas Zod e as regras puras de `src/models` são compartilhados entre cliente e servidor.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| #1 E-mail de confirmação/recuperação sem envio real (spec FR-019) | Execução só local, sem SMTP nem lib de e-mail autorizada | `nodemailer` + SMTP fica para quando houver hospedagem, com autorização. Por enquanto: links no console + reset manual por admin |

## Pendências para o usuário

1. ~~Autorizar o Vitest~~ (autorizado em 2026-10-17).
2. **Lista das restrições por dia**: será cadastrada manualmente na aba Admin
   (`/admin/dias`). O seed cria os 48 dias "Sem restrição".
3. ~~Emenda à Constituição~~ (v1.1.0 em 2026-10-17).
4. **Logo da Sword Brazil**: fornecer o arquivo para `public/brand/sword-brazil.png`.
5. Opcional: avisar ou pedir ok ao mantenedor do thanosvibs antes de rodar
   `npm run assets:import`.
