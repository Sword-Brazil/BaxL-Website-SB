# MFF System · Sword Brazil

Plataforma de metas da **Batalha de Aliança** de *Marvel Future Fight* para a aliança **Sword Brazil**:
equipes Meta por dia de **BAX** e **BAL** (ciclo de 28 dias), modo livre da BAL, **BAI**, elenco pessoal,
montagem de equipe com CTPs (arrastar e soltar) e sugestões, com curadoria pela aba Admin.

> Projeto de fã, **não oficial** e **sem fins comerciais**. *Marvel Future Fight* é propriedade da
> Netmarble; os personagens são propriedade da Marvel. Calendário e equipes de base importados do
> [Guia BAX/BAL/BAI](https://guiabaxbal.web.app/), com curadoria da Sword Brazil.

Especificação, plano e tarefas: [`specs/001-alliance-battle-metas/`](specs/001-alliance-battle-metas/).

## Requisitos

- Node.js 22 LTS e npm **do Linux** (no WSL, o `npm` do Windows não funciona em caminhos do WSL).
  Com nvm: `nvm install 22 && nvm use 22`.
- Um projeto no [Supabase](https://supabase.com) (plano gratuito): Postgres para o banco e Storage para
  as imagens enviadas pela curadoria. Para desenvolver sem Supabase, qualquer Postgres serve
  (ex.: `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:17-alpine`).

## Configuração

```bash
npm install                    # também gera o Prisma Client (postinstall)
cp .env.example .env.local     # preencha as conexões do Supabase, SESSION_SECRET e o administrador
npx prisma migrate deploy      # cria as tabelas no Postgres
npx prisma db seed             # CTPs, 48 dias de BAX/BAL, configurações e o Administrador padrão
npm run dev                    # http://localhost:3000
```

A CLI do Prisma lê `.env`, não `.env.local`: rode os comandos `npx prisma …` com as variáveis
exportadas (`set -a; source .env.local; set +a` no bash) ou copie `DATABASE_URL`/`DIRECT_URL` para `.env`.

Variáveis em `.env.local`:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres pelo *Transaction pooler* do Supabase (porta 6543, `?pgbouncer=true&connection_limit=1`). |
| `DIRECT_URL` | Conexão direta ou *Session pooler* (porta 5432): usada pelas migrações. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Storage das imagens enviadas (chave secreta, só no servidor). Sem elas, no ambiente local, os uploads vão para `public/assets/uploads`. |
| `SUPABASE_STORAGE_BUCKET` | Bucket público das imagens (padrão `assets`). |
| `SESSION_SECRET` | ≥ 32 caracteres aleatórios. Sem ele o servidor não inicia. |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Administrador padrão (ex.: usuário `Sword Menezes`). O e-mail é opcional. |
| `APP_URL` | URL pública do site (links dos avisos por e-mail). |

Rodar `npx prisma db seed` de novo é seguro: ele não duplica nada e atualiza a senha do administrador.

## Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento. |
| `npm test` | Testes (Vitest): regras puras, schemas e services. Os services rodam num Postgres em memória (PGlite), sem Docker nem Supabase. |
| `npm run build` / `npm start` | Build e servidor de produção. |
| `npx prisma db seed` | Dados base e o Administrador padrão. |
| `npm run db:migrate-data` | Copia o antigo `prisma/dev.db` (SQLite) para o Postgres e envia `public/assets/uploads` ao Storage. Rode num banco vazio, antes do seed. |
| `npm run import:guiabaxbal [-- --replace]` | Importa o snapshot do Guia BAX/BAL/BAI (`prisma/data/`): calendário de 28 dias, 115 personagens e trajes, equipes Meta e Alternativa de BAX/BAL/BAI. `--replace` substitui as equipes existentes. |
| `npm run import:images` | Copia as fotos de `img/` (personagens, CTPs e ícones de restrição) para `public/assets` e liga cada retrato ao traje, conforme `prisma/data/images.json`. Rode depois de `import:guiabaxbal`. |
| `npm run seed:demo` | **Só para desenvolvimento**: 12 agentes e 3 equipes Meta de exemplo (não use junto com a importação). |
| `npm run assets:import` | Baixa as imagens de `scripts/assets-manifest.json` para `public/assets/`. Avise o mantenedor do site de origem antes de rodar. |
| `npm run check:locales` | Confere se PT-BR, EN e ES têm as mesmas chaves de tradução. |

## Uso

- **Público** (sem login): `/` é a tela central da Batalha de Aliança, com os 28 dias, BAX e BAL lado
  a lado (Meta e Alternativa), a BAI ocupando o dia inteiro e o dia atual destacado. Também há
  `/meu-elenco` (personagens, trajes e CTPs equipados), `/estatisticas` (gráficos) e `/bal/livre`.
- **Contas**: só Administradores criam contas (jogadores entram com nome de usuário; curadoria pode usar
  o e-mail) e trocam senhas de quem esqueceu, em `/admin/usuarios`. Logado, o elenco, as equipes, os
  CTPs e o nome no jogo ficam na conta e iguais em todo aparelho. Sem entrar, tudo fica no aparelho.
- **Admin** (`/admin`, Curadores e Administradores): restrições dos dias, equipes Meta, listas de
  prioridade, catálogo e imagens, e chefes da BAI. Usuários e configurações do calendário são só para
  Administradores.
- **Calendário** (horário de Brasília): o dia vira às 12h, o reset semanal da pontuação é às 22h e o
  3º dia de cada semana é a BAI. Ajuste a âncora do ciclo em `/admin/config` se o "Dia atual" estiver
  diferente do jogo.
- **E-mail**: ainda sem provedor de envio. Os avisos críticos (senha trocada, papel alterado, bloqueio)
  aparecem no app e no log do servidor.

## Deploy (Vercel + Supabase)

1. **Supabase**: crie o projeto (região São Paulo, `sa-east-1`). Em *Connect* copie as strings do
   *Transaction pooler* (`DATABASE_URL`) e do *Session pooler* (`DIRECT_URL`); em *API*, a URL e a
   chave secreta (`service_role`).
2. **Banco** (do seu computador, com as variáveis do Supabase exportadas):
   `npx prisma migrate deploy` → `npm run db:migrate-data` (só se for trazer o SQLite antigo) →
   `npx prisma db seed`. As tabelas têm RLS ligado e nenhuma policy: a Data API do Supabase não
   lê nem grava nada; só o app (Prisma) acessa.
3. **Vercel**: importe o repositório (branch `master`), framework Next.js, e cadastre em *Environment
   Variables* (Production): `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_STORAGE_BUCKET`, `SESSION_SECRET` (um novo, só da produção) e `APP_URL`. Em *Settings →
   Functions*, escolha a região `gru1` (São Paulo), perto do banco.
4. **Migrações futuras**: rode `npx prisma migrate deploy` contra o Supabase antes (ou junto) do deploy
   que precisar delas; ou mude o *Build Command* da Vercel para `prisma migrate deploy && next build`.

## Backup

O banco fica no Supabase e as imagens enviadas, no Storage. O que o seu plano guarda de backup
aparece em *Database → Backups* no painel. Para ter uma cópia própria: `pg_dump "$DIRECT_URL" > backup.sql`.

## Arquitetura (MVVM)

```text
src/models/      Model: tipos, enums, schemas Zod, regras puras (calendário, restrição, sugestão) e clientes de API
src/viewmodels/  ViewModel: hooks use*ViewModel (TanStack Query + Zustand)
src/views/       View: composições de componentes shadcn/ui, sem regra de negócio
src/pages/       Pages Router: páginas e API Routes (pages/api)
src/server/      Somente servidor: Prisma, sessão (iron-session), repositórios e services
src/components/  shadcn/ui (restilizado com os tokens MFF em src/styles/globals.css)
```

## Regras do projeto

- Toda lib nova precisa de **autorização** antes de ser instalada. Lista aprovada em
  [`research.md`](specs/001-alliance-battle-metas/research.md#resumo-de-dependências).
- Nenhum componente visual é criado do zero: use `npx shadcn@latest add <componente>` e restilize.
- Todo texto de interface vem de `public/locales/{pt-BR,en,es}`. Termos do jogo (BAX, BAL, BAI, CTP,
  nomes de agentes) não são traduzidos.
