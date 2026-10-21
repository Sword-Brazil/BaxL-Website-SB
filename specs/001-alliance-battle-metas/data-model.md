# Data Model: Plataforma de Metas da Batalha de Aliança

**Feature**: `001-alliance-battle-metas` | **Date**: 2026-10-17

Persistência (atualizado em 2026-10-21): **Postgres no Supabase** via Prisma (servidor; migrações
em `prisma/migrations`, RLS ligado em todas as tabelas e sem policies) e Zustand `persist` (cópia
no aparelho do usuário). Imagens enviadas pela curadoria ficam no **Supabase Storage** (bucket
público `assets`) e o `imagePath` guarda a URL pública. Os "enums" são `String` validados por Zod
(ver research R5). `id` = cuid. Todas as tabelas de conteúdo têm `createdAt` e `updatedAt`.

## Enums de domínio (Zod)

| Enum | Valores |
|------|---------|
| `Mode` | `BAX`, `BAL`, `BAI` |
| `Role` | `USER`, `CURATOR`, `ADMIN` (ADMIN inclui as permissões de CURATOR) |
| `Gender` | `MALE`, `FEMALE`, `NONE` |
| `Side` | `HERO`, `VILLAIN` |
| `Species` | `MUTANT`, `INHUMAN`, `HUMAN`, `ALIEN`, `NEO_HUMAN`, `OTHER` (lista editável no código) |
| `AttackType` | `COMBAT`, `BLAST`, `SPEED`, `UNIVERSAL` |
| `CriterionAttribute` | `GENDER`, `SIDE`, `SPECIES`, `ATTACK_TYPE` |
| `CtpType` | `RAGE` (Fúria), `LIBERATION` (Liberação), `INSIGHT` (Percepção), `COMPETITION` (Competição), `JUDGEMENT` (Julgamento), `ASCENT` (Salto) |
| `CtpQuality` | `NORMAL`, `MIGHTY` (Poderoso), `BRILLIANT` (Brilhante) |
| `Slot` | `SOLO` (Solador), `SUPPORT_1`, `SUPPORT_2` |
| `TeamScope` | `DAY`, `BAL_FREE`, `BAI` |

## Catálogo

### Agent
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| slug | string | único, kebab-case |
| name | string | 1–80 caracteres, nome oficial do jogo |
| active | boolean | `false` = "indisponível" (nunca apagar se houver referências) |

Relações: 1–N `Uniform`. O personagem não tem atributos: eles são de cada traje.

### Uniform
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| agentId | FK Agent | obrigatório |
| slug | string | único por agente |
| name | string | 1–80 caracteres; "Padrão" para o visual base |
| imagePath | string | caminho em `public/assets/agents/...` |
| gender, side, species, attackType | enum ou `UNKNOWN` | atributos do traje (ex.: Fênix Negra vilã); restrições e o selo herói/vilão usam o traje |
| active | boolean | |

### Rotation
| Campo | Tipo | Regras |
|-------|------|--------|
| agentId | FK Agent | cascade |
| uniformId | FK Uniform? | traje do próprio personagem; null = vale para todos os trajes |
| position | int | ordem na tela do jogador |
| title | string? | ≤ 80 caracteres |
| sequence | string | texto livre, 1–1000 caracteres (sem formato obrigatório) |
| description | string? | ≤ 3000 caracteres |
| videoUrl | string? | link https do YouTube (com `?t=` opcional) ou de arquivo .mp4/.webm externo; o sistema não hospeda vídeo |

### Ctp (catálogo fixo: 6 tipos × 3 qualidades = 18 linhas, criadas pelo seed)
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| type | CtpType | |
| quality | CtpQuality | (type, quality) único |
| imagePath | string | PNG sem fundo em `public/assets/ctp/` |

O nome exibido vem do i18n (`ctp.RAGE` → "Fúria"), não do banco.

## Calendário e restrições

### Settings (linha única)
| Campo | Tipo | Regras |
|-------|------|--------|
| cycleAnchor | datetime (UTC) | instante de início do Dia 1 (quinta, 12:00 BRT) |
| dayTurnoverHour | int | padrão 12 (BRT) |
| weeklyResetHour | int | padrão 22 (BRT) |
| baiWeekday | int | padrão 3 (3º dia da semana) |

### BattleDay
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| mode | Mode | `BAX` ou `BAL` (nunca `BAI`) |
| number | int | 1–28, exceto os dias de BAI (3, 10, 17, 24) |
| — | — | (mode, number) único → 48 linhas criadas pelo seed |

O dia da semana é derivado: `["QUI","SEX","SÁB","DOM","SEG","TER","QUA"][(number-1) % 7]`.

### RestrictionCriterion
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| battleDayId | FK BattleDay | |
| attribute | CriterionAttribute | (battleDayId, attribute) único: um valor por atributo |
| value | string | precisa ser válido para o enum do atributo |

**Regra "E"**: um agente atende ao dia se e somente se, para todo critério, `agent[attribute] ==
value`. Um dia sem critérios equivale a "Sem restrição". Os critérios são editados manualmente na
aba Admin.

## Equipes curadas

### MetaTeam
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| scope | TeamScope | |
| battleDayId | FK BattleDay? | obrigatório se `scope = DAY`, nulo nos demais |
| isPrimary | boolean | no máximo 1 principal por (scope, battleDayId) |
| label | string? | ex.: "Alternativa sem Uniforme X" |
| notes | string? | ≤ 500 caracteres, i18n opcional |
| updatedById | FK User | autor da última publicação |
| updatedAt | datetime | exibido ao público (FR-009) |

### MetaTeamMember
| Campo | Tipo | Regras |
|-------|------|--------|
| metaTeamId | FK MetaTeam | |
| slot | Slot | (metaTeamId, slot) único: exatamente 3 membros |
| uniformId | FK Uniform | o agente é derivado do uniforme |
| ctpId | FK Ctp | obrigatório |
| isDamageDealer | boolean | Causador de Dano (qualquer slot); default false. As rotações ficam em `Rotation` |

**Validações ao publicar** (FR-026):
- Três slots preenchidos, sem agente repetido.
- Uniformes e CTPs ativos e existentes.
- Se `scope = DAY`, os três agentes atendem à restrição do dia.

### PriorityEntry (listas de prioridade para sugestões)
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| scope | TeamScope | `DAY` ou `BAI` |
| battleDayId | FK BattleDay? | conforme o scope |
| role | `SOLO` \| `SUPPORT` | |
| rank | int | ≥ 1, único por (scope, battleDayId, role) |
| uniformId | FK Uniform | |
| ctpId | FK Ctp? | CTP recomendado |

### BaiBoss
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| position | int | ≥ 1, único (sequência única para todas as semanas) |
| name | string | |
| imagePath | string? | |
| tips | string? | ≤ 500 caracteres |

O texto explicativo da BAI fica no i18n.

## Usuários e autenticação

### User
| Campo | Tipo | Regras |
|-------|------|--------|
| id | string | PK |
| username | string | único; login; minúsculo, espaços simples, 3–30 de `[a-z0-9 ._-]` (ex.: `sword menezes`) |
| passwordHash | string | bcrypt custo 12; senha nova forte (8+, minúscula, MAIÚSCULA, número, símbolo) |
| nickname | string? | apelido para exibir, ≤ 30 caracteres |
| role | Role | `USER` (jogador), `CURATOR` ou `ADMIN`; padrão `USER` |

Sem e-mail (removido em 2026-10-21, migração `username_only`). Só um ADMIN cria contas, troca
papéis e redefine senhas.

**Invariante**: sempre ≥ 1 usuário com `role = ADMIN` (FR-024).

### UserSelectionsDoc
| Campo | Tipo | Regras |
|-------|------|--------|
| userId | FK User | PK, cascade |
| json | string | documento `UserSelections` (abaixo) |
| updatedAt | datetime | gravação condicional: só atualiza se o aparelho estiver na mesma versão (senão 409) |

### LoginAttempt
| Campo | Tipo | Regras |
|-------|------|--------|
| key | string | `usuário|ip` (5 falhas em 15 min) ou `usuário|*` (20 falhas em 15 min, qualquer IP) |
| failedCount | int | |
| lockedUntil | datetime? | bloqueio de 15 min |

### SecurityNotice
| Campo | Tipo | Regras |
|-------|------|--------|
| userId | FK User | cascade |
| type | evento de atenção/crítico do catálogo (`securityEvents.ts`) | um aberto por tipo e usuário |
| params | JSON? | só dados não sensíveis (ex.: `{"role":"CURATOR"}`) |
| originSessionId | string? | sessão que fez o login (o "novo login" não aparece nela) |
| dismissedAt | datetime? | dispensado pelo usuário |

### Sessão (cookie, sem tabela)
Cookie `mff_session` (iron-session, criptografado): `userId`, `sid`, `loginAt`, `remember` e
`expiresAt`. "Manter logado" = cookie de 30 dias; sem ele, cookie de sessão (some ao fechar o
navegador) e `expiresAt` de 12 h, conferido pelo proxy e pela API.

## Dados do usuário

### UserSelections (documento versionado)

Fica na conta (`UserSelectionsDoc`) e no Zustand `persist` (cópia no aparelho). Ao entrar, aparelho
e conta são mesclados (conta vazia → envia o aparelho; aparelho vazio → usa a conta; diferentes →
o jogador escolhe). Mudanças sobem com debounce de 2 s. Ao sair, o aparelho é limpo.

```text
UserSelections {
  version: 1
  updatedAt: ISO datetime
  nickname: string                               // nome no jogo (≤ 30)
  roster: { ownedUniformIds: string[] }          // o agente é possuído se ≥1 uniforme for
  teams: {
    [key: "BAX-4" | "BAL-17" | "BAI"]: {
      SOLO?: { uniformId, ctpId? }
      SUPPORT_1?: { uniformId, ctpId? }
      SUPPORT_2?: { uniformId, ctpId? }
    }
  }
}
```

- **Regras**:
  - Um CTP por slot.
  - Um agente não pode ocupar dois slots da mesma equipe.
  - IDs inexistentes ou inativos aparecem como "indisponível" e não são apagados.
- **Backup**: exportar/importar o mesmo JSON, validado pelo `UserSelectionsSchema`.

## Regras derivadas (Model puro, testado)

| Função | Entrada | Saída |
|--------|---------|-------|
| `getBattleClock(now, settings)` | instante, Settings | `{ cycleDay 1–28, weekIndex 0–3, mode: "BAX_BAL" \| "BAI", weekLabel, isResetDay, beforeWeeklyReset, nextBaiStart }` |
| `matchesRestriction(agent, criteria[])` | agente, critérios | boolean (regra "E") |
| `compareWithMeta(userTeam, metaTeam)` | equipes | status por slot: `MATCH` \| `DIFFERENT` \| `NOT_OWNED` \| `UNIFORM_NOT_OWNED` \| `CTP_DIFFERENT` |
| `suggestTeam(roster, priorityEntries, criteria)` | elenco, listas | melhor Solador + 2 Suportes possuídos e válidos, ou `null` |

## Transições de estado

- **Agent/Uniform**: `active` → `inactive` (soft delete). Nunca é apagado com referências.
- **User.role**:
  - `USER` ↔ `CURATOR` ↔ `ADMIN`, alterado só por um ADMIN.
  - Rebaixar o último ADMIN é bloqueado.
- **User.role `USER`** = jogador: entra, vê o site e guarda as próprias seleções; não acessa o Admin.
