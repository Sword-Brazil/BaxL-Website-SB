# Quickstart & Validation: Plataforma de Metas da BA

**Feature**: `001-alliance-battle-metas` | **Date**: 2026-10-17

Guia para rodar localmente e validar a feature de ponta a ponta. Contratos em
[contracts/api.md](./contracts/api.md) e entidades em [data-model.md](./data-model.md).

## Pré-requisitos

- Node.js 20 LTS ou superior e npm.
- Nenhum serviço externo: o banco é SQLite (`prisma/dev.db`).

## Setup

```bash
npm install
cp .env.example .env.local
```

Variáveis de `.env.local`:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | `"file:./dev.db"` |
| `SESSION_SECRET` | ≥ 32 caracteres aleatórios |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | sua conta ADMIN |
| `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` | sua conta USER comum |

```bash
npx prisma migrate dev     # cria o banco
npx prisma db seed         # 18 CTPs, 48 BattleDays (BAX/BAL), Settings, contas ADMIN e USER
npm run assets:import      # opcional: baixa imagens do manifesto para public/assets
npm run dev                # http://localhost:3000
```

## Testes automatizados

> Vitest (autorizado em 2026-10-17).

```bash
npm test
```

Devem passar:
- `getBattleClock`: viradas às 11:59/12:00 BRT, dia de reset antes e depois das 22:00, dias de
  BAI 3/10/17/24, usuário em outro fuso (ex.: `TZ=Asia/Tokyo`).
- `matchesRestriction`: critério único, combinação "E" e sem restrição.
- `compareWithMeta` e `suggestTeam`, incluindo um elenco sem agentes válidos (retorna `null`).
- Schemas Zod: login, cadastro, `CreateStaffSchema`, `MetaTeamSchema` (3 slots, sem repetição),
  `UserSelectionsSchema`.

## Cenários de validação manual

| # | Passos | Esperado | Ref. |
|---|--------|----------|------|
| 1 | Abrir `/` no celular (DevTools 390px) sem login | Dia atual de BAX e BAL (ou destaque da BAI) com restrição, equipe Meta, uniformes e CTPs em ≤ 5 s | US1, SC-001 |
| 2 | Em `/`, tocar em BAL e depois no Dia 18 | Detalhe do Dia 18 em 2 interações | FR-004 |
| 3 | Abrir `/bax` | Os dias 3, 10, 17 e 24 não aparecem | FR-003 |
| 4 | Alterar o relógio do sistema para 11:59 e 12:00 BRT, e 21:59 e 22:00 do dia de reset | O número do dia muda só às 12:00. Às 22:00 do dia de reset aparece o aviso de nova semana com o mesmo número de dia. Tudo atualiza sem recarregar | FR-001/002 |
| 5 | Trocar o idioma para EN e ES | Textos traduzidos; BAX/BAL/BAI/CTP e nomes de agentes mantidos | FR-028 |
| 6 | Alternar o tema claro/escuro e recarregar | Tema preservado | FR-028 |
| 7 | Em `/meu-elenco`, marcar agentes; em `/bax/4` (restrição "Vilão") montar a equipe | Só aparecem vilões possuídos; comparação com a Meta sinalizada | US2 |
| 8 | Arrastar "Fúria Brilhante" para o Solador; repetir por toque (tocar no CTP e depois no agente) e por teclado | CTP aplicado; outro CTP substitui; "remover CTP" funciona | US3 |
| 9 | Exportar o backup, limpar os dados do site e importar | Seleções restauradas | FR-017 |
| 10 | Entrar com a conta USER do seed em dois navegadores | Mesmas seleções; um conflito pede escolha | FR-018 |
| 11 | Entrar com a conta USER e abrir `/admin` | Acesso negado | US5 |
| 12 | Entrar com a conta ADMIN: editar a restrição do BAX Dia 6 para "Feminino + Mutante" e publicar uma Meta com um agente masculino | Bloqueio 422 com o motivo | FR-026 |
| 13 | ADMIN cria um novo ADMIN com e-mail inválido e depois válido | Erro de validação Zod no formulário; depois, sucesso | FR-024 |
| 14 | ADMIN tenta rebaixar a si mesmo sendo o único ADMIN | 409 "último administrador" | FR-024 |
| 15 | Errar a senha 5 vezes | 6ª tentativa bloqueada temporariamente (429) | FR-019 |
| 16 | "Esqueci minha senha" no modo local | Link de redefinição exibido no console do servidor | research R6 |
| 17 | Exportar a imagem da equipe do dia | PNG baixado com a equipe | FR-022 |
| 18 | Rodapé de qualquer página | Aviso de projeto de fã, não oficial e sem fins comerciais | FR-029 |
