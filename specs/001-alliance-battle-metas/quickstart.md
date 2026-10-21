# Quickstart & Validation: Plataforma de Metas da BA

**Feature**: `001-alliance-battle-metas` | **Date**: 2026-10-17 | **Atualizado**: 2026-10-21

Guia para rodar localmente e validar a feature de ponta a ponta. Contratos em
[contracts/api.md](./contracts/api.md) e entidades em [data-model.md](./data-model.md). O passo a
passo para publicar na Vercel está no [README](../../README.md#deploy-vercel--supabase).

## Pré-requisitos

- Node.js 22 LTS e npm do Linux (no WSL, não use o npm do Windows).
- Projeto no Supabase (Postgres + Storage). Para desenvolver sem ele, qualquer Postgres serve.

## Setup

```bash
npm install                # também gera o Prisma Client
cp .env.example .env.local # preencha conforme a tabela abaixo
npm run db:deploy          # cria as tabelas (prisma migrate deploy com o .env.local)
npm run db:seed            # 18 CTPs, 48 dias de BAX/BAL, Settings e o Administrador padrão
npm run dev                # http://localhost:3000
```

| Variável | Uso |
|----------|-----|
| `SUPABASE_DB_PASSWORD` | Senha do banco (só letras e números; entra nas URLs abaixo via `${...}`) |
| `DATABASE_URL` | *Transaction pooler* (6543) com `?pgbouncer=true&connection_limit=5&pool_timeout=20` |
| `DIRECT_URL` | *Session pooler* (5432), usado pelas migrações |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Storage das imagens enviadas (chave secreta, só no servidor) |
| `SESSION_SECRET` | ≥ 32 caracteres aleatórios |
| `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` | Administrador padrão (ex.: `Sword Menezes`) |

Migrar de um `prisma/dev.db` (SQLite) antigo: `npm run db:deploy` → `npm run db:migrate-data` →
`npm run db:seed`, nessa ordem (o seed por último).

## Testes automatizados

```bash
npm test          # Vitest; os services rodam num Postgres em memória (PGlite)
npm run lint
npm run check:locales
npm run build
```

Cobrem, entre outros: calendário (viradas às 12:00 e 22:00 BRT, fusos), restrições, comparação e
sugestão, schemas Zod (login, `CreateUserSchema`, senha forte, nome de usuário), login (bloqueios
por conta+IP e por conta), contas, sincronização (409 entre aparelhos), avisos de segurança,
CSRF/origem, destino seguro depois do login, classificação de erros e detecção de banco fora do ar.

## Cenários de validação manual

| # | Passos | Esperado | Ref. |
|---|--------|----------|------|
| 1 | Aba anônima: abrir `/`, `/meu-elenco`, `/admin`, `/en` | Todas levam a "Entrar", sem menu | FR-018 |
| 2 | Entrar como `Sword Menezes` (testar também `sword  MENEZES`) | Entra; volta para a página que tentou abrir | FR-019 |
| 3 | Senha errada; depois 5 vezes seguidas | Mensagem genérica no formulário; 6ª tentativa bloqueada (429) | FR-019 |
| 4 | Entrar **sem** "Manter logado", fechar o navegador e abrir de novo | Pede login | FR-018 |
| 5 | Entrar **com** "Manter logado", fechar e abrir | Entra direto | FR-018 |
| 6 | Admin → Usuários → Nova conta (Jogador) com senha fraca e depois forte | Medidor de força; senha fraca recusada; conta criada | FR-019 |
| 7 | Redefinir a senha do jogador | A senha antiga para de funcionar; aviso de segurança para ele | FR-019 |
| 8 | Como jogador: marcar elenco, equipar CTPs, montar equipe; entrar em outro navegador | Mesmos dados; ao sair, o aparelho fica vazio | FR-017 |
| 9 | Como jogador, abrir `/admin` | Acesso negado | US5 |
| 10 | Em `/`, ver o dia atual e chegar a qualquer dia | Restrição, Meta, uniformes e CTPs; qualquer dia em ≤ 2 interações | US1 |
| 11 | Arrastar um CTP para um agente; repetir por toque | CTP aplicado; outro substitui; remover funciona | US3 |
| 12 | Curador publica Meta que viola a restrição do dia | Bloqueio 422 com o motivo | FR-026 |
| 13 | Admin → Catálogo/CTPs: enviar uma foto | Aparece; o endereço é do `supabase.co/storage` | research R11 |
| 14 | Rotações: abrir um vídeo | Capa em largura total; toca na própria página | — |
| 15 | Trocar idioma (EN/ES), tema e tamanho de fonte (AA) | Textos traduzidos; preferências mantidas | FR-028 |
| 16 | Celular (390px), tablet (768px) e notebook (1366px) | Sem rolagem horizontal; menu ☰ abaixo de 1280px | FR-028 |
| 17 | Com o servidor sem acesso ao banco (ou sem internet) | Alerta fixo "Sem conexão…" com "Tentar novamente" | FE-001 |
| 18 | Rodapé | Aviso de projeto de fã, não oficial e sem fins comerciais | FR-029 |
