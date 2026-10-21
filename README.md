# MFF System · Sword Brasil

Plataforma de metas da **Batalha de Aliança** de *Marvel Future Fight* para a aliança **Sword Brasil**:
equipes Meta por dia de **BAX** e **BAL** (ciclo de 28 dias), modo livre da BAL, **BAI**, elenco pessoal,
montagem de equipe com CTPs (arrastar e soltar) e sugestões, com curadoria pela aba Admin.

> Projeto de fã, **não oficial** e **sem fins comerciais**. *Marvel Future Fight* é propriedade da
> Netmarble; os personagens são propriedade da Marvel. Calendário e equipes de base importados do
> [Guia BAX/BAL/BAI](https://guiabaxbal.web.app/), com curadoria da Sword Brasil.

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
npm run db:deploy              # cria as tabelas no Postgres
npm run db:seed                # CTPs, 48 dias de BAX/BAL, configurações e o Administrador padrão
npm run dev                    # http://localhost:3000
```

Os scripts `npm run db:*` leem o `.env.local` como o Next (aceitam `${VAR}`, ex.: a senha do banco
dentro das URLs). Use o **pooler** do Supabase (`aws-0-<região>.pooler.supabase.com`): a conexão
direta `db.<ref>.supabase.co` é só IPv6 e não funciona no WSL nem na Vercel.

Variáveis em `.env.local`:

| Variável | Uso |
|----------|-----|
| `SUPABASE_DB_PASSWORD` | Senha do banco (só letras e números). Entra nas duas URLs abaixo com `${SUPABASE_DB_PASSWORD}` (só no `.env.local`; na Vercel use as URLs completas). |
| `DATABASE_URL` | Postgres pelo *Transaction pooler* do Supabase (porta 6543, `?pgbouncer=true&connection_limit=5&pool_timeout=20`). |
| `DIRECT_URL` | *Session pooler* (porta 5432): usada pelas migrações. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Storage das imagens enviadas (chave secreta, só no servidor). Sem elas, no ambiente local, os uploads vão para `public/assets/uploads`. |
| `SUPABASE_STORAGE_BUCKET` | Bucket público das imagens (padrão `assets`). |
| `SESSION_SECRET` | ≥ 32 caracteres aleatórios. Sem ele o servidor não inicia. |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` | Administrador padrão (ex.: `Sword Menezes`). Ele cria as demais contas. |

Rodar `npm run db:seed` de novo é seguro: ele não duplica nada e atualiza a senha do administrador.

## Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento. |
| `npm test` | Testes (Vitest): regras puras, schemas e services. Os services rodam num Postgres em memória (PGlite), sem Docker nem Supabase. |
| `npm run build` / `npm start` | Build e servidor de produção. |
| `npm run db:deploy` | Aplica as migrações no Postgres (`prisma migrate deploy` com o `.env.local`). |
| `npm run db:seed` | Dados base e o Administrador padrão. |
| `npm run db:migrate-data` | Copia o antigo `prisma/dev.db` (SQLite) para o Postgres e envia `public/assets/uploads` ao Storage. Rode num banco vazio, antes do seed. |
| `npm run import:guiabaxbal [-- --replace]` | Importa o snapshot do Guia BAX/BAL/BAI (`prisma/data/`): calendário de 28 dias, 115 personagens e trajes, equipes Meta e Alternativa de BAX/BAL/BAI. `--replace` substitui as equipes existentes. |
| `npm run import:images` | Copia as fotos de `img/` (personagens, CTPs e ícones de restrição) para `public/assets` e liga cada retrato ao traje, conforme `prisma/data/images.json`. Rode depois de `import:guiabaxbal`. |
| `npm run seed:demo` | **Só para desenvolvimento**: 12 agentes e 3 equipes Meta de exemplo (não use junto com a importação). |
| `npm run assets:import` | Baixa as imagens de `scripts/assets-manifest.json` para `public/assets/`. Avise o mantenedor do site de origem antes de rodar. |
| `npm run check:locales` | Confere se PT-BR, EN e ES têm as mesmas chaves de tradução. |

## Uso

- **Site privado da aliança**: sem login, nada é exibido além de `/entrar` (páginas e APIs exigem
  sessão). Todo login é **nome de usuário + senha** (sem e-mail).
- **Membros**: `/` é a tela central da Batalha de Aliança, com os 28 dias, BAX e BAL lado
  a lado (Meta e Alternativa), a BAI ocupando o dia inteiro e o dia atual destacado. Também há
  `/meu-elenco` (personagens, trajes e CTPs equipados), `/estatisticas` (gráficos) e `/bal/livre`.
- **Contas**: só Administradores criam contas e trocam senhas de quem esqueceu, em `/admin/usuarios`.
  O elenco, as equipes, os CTPs e o nome no jogo ficam na conta e iguais em todo aparelho; ao sair,
  o aparelho é limpo.
- **Admin** (`/admin`, Curadores e Administradores): restrições dos dias, equipes Meta, listas de
  prioridade, catálogo e imagens, e chefes da BAI. Usuários e configurações do calendário são só para
  Administradores.
- **Calendário** (horário de Brasília): o dia vira às 12h, o reset semanal da pontuação é às 22h e o
  3º dia de cada semana é a BAI. Ajuste a âncora do ciclo em `/admin/config` se o "Dia atual" estiver
  diferente do jogo.
- **Login**: "Manter logado" deixa a pessoa conectada por 30 dias; sem marcar, a sessão termina ao
  fechar o navegador (e em no máximo 12 h). Senhas novas precisam ser fortes (8+ caracteres, com
  minúscula, MAIÚSCULA, número e símbolo).
- **Avisos de segurança** (novo login, senha trocada, papel alterado, bloqueio) aparecem no app.
- **Erros**: os graves (sem conexão, banco fora do ar, erro no servidor, acesso negado, sessão
  encerrada) aparecem num alerta fixo no topo; os leves, numa notificação.
- **Segurança**: CSRF bloqueado (só requisições do próprio site e em JSON), cabeçalhos de segurança
  (CSP, sem iframe de terceiros, HSTS…), limite de tentativas de login por conta e por IP, e só o
  Prisma acessa o banco (RLS ligado no Supabase).

## Deploy (Vercel + Supabase)

O banco já está no Supabase (projeto `trmvrhunlmrankshppvs`, região **us-east-1**), com as tabelas,
os dados e o administrador **Sword Menezes**. Falta publicar o site:

1. **Gerar o segredo da produção** (diferente do local):
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. **Importar na Vercel**: *Add New → Project* → `Sword-Brazil/BaxL-Website-Mff-Sword-Brazil`. Se o
   repositório não aparecer, um dono da organização precisa liberar o app da Vercel no GitHub.
   Framework **Next.js** (detectado), pasta raiz = raiz do repositório, comandos padrão.
3. **Environment Variables** (marque só *Production*; *Preview* ficaria ligado ao banco de produção):

   | Variável | Valor |
   |----------|-------|
   | `DATABASE_URL` | `postgresql://postgres.<ref>:<SENHA>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=20` |
   | `DIRECT_URL` | `postgresql://postgres.<ref>:<SENHA>@aws-0-us-east-1.pooler.supabase.com:5432/postgres` |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | chave secreta do Supabase (*Project Settings → API Keys*) |
   | `SUPABASE_STORAGE_BUCKET` | `assets` |
   | `SESSION_SECRET` | o segredo do passo 1 |

   A Vercel não expande `${...}`: escreva a senha dentro das URLs (símbolos precisam ser
   codificados, ex.: `!` → `%21`).
4. **Settings → Build and Deployment**: *Node.js Version* **22.x**; *Production Branch* `master`.
5. **Settings → Functions**: *Function Region* **Washington, D.C. (`iad1`)**, a mesma região do
   banco (`gru1` só se o Supabase estiver em São Paulo).
6. **Publicar**: faça o merge do PR `Dev → master`; a Vercel constrói e publica sozinha. Acompanhe em
   *Deployments*. Depois, abra a URL e entre como Sword Menezes.
7. **Conferir em produção**: aba anônima cai no login; login, Admin → Usuários (criar um jogador),
   envio de uma imagem (URL do `supabase.co/storage`) e os cabeçalhos de segurança
   (`curl -I https://<seu-site>`).
8. **Domínio (opcional)**: *Settings → Domains*.

Depois disso:

- **CI** (`.github/workflows/ci.yml`): todo PR e push na `Dev`/`master` roda lint, `tsc`,
  `check:locales`, testes e build. O deploy continua sendo o da Vercel (preview por PR, produção na
  `master`).
- **Migrações novas**: no push para a `master`, o job `migrate` do CI roda `prisma migrate deploy`
  se os secrets `DATABASE_URL` e `DIRECT_URL` estiverem no GitHub (*Settings → Secrets and variables
  → Actions*, URLs completas). Sem eles, rode `npm run db:deploy` contra o Supabase antes do merge.
- **Novo projeto Supabase do zero**: `npm run db:deploy` → `npm run db:migrate-data` (só para trazer
  um `dev.db` antigo) → `npm run db:seed`, nessa ordem.
- **Plano gratuito do Supabase**: projetos sem uso por um tempo podem ser pausados; reative pelo
  painel se o site mostrar "Sem conexão com o banco de dados".

## Backup

O banco fica no Supabase e as imagens enviadas, no Storage. O que o seu plano guarda de backup
aparece em *Database → Backups* no painel. Para ter uma cópia própria: `pg_dump "$DIRECT_URL" > backup.sql`.

## Arquitetura (MVVM)

```text
src/models/      Model: tipos, enums, schemas Zod, regras puras (calendário, restrição, sugestão) e clientes de API
src/viewmodels/  ViewModel: hooks use*ViewModel (TanStack Query + Zustand)
src/views/       View: composições de componentes shadcn/ui, sem regra de negócio
src/pages/       Pages Router: páginas e API Routes (pages/api)
src/proxy.ts     Site privado: exige sessão em toda página e API (Next 16 "proxy", antes "middleware")
src/server/      Somente servidor: Prisma, sessão (iron-session), repositórios e services
src/components/  shadcn/ui (restilizado com os tokens MFF em src/styles/globals.css)
```

## Regras do projeto

- Toda lib nova precisa de **autorização** antes de ser instalada. Lista aprovada em
  [`research.md`](specs/001-alliance-battle-metas/research.md#resumo-de-dependências).
- Nenhum componente visual é criado do zero: use `npx shadcn@latest add <componente>` e restilize.
- Todo texto de interface vem de `public/locales/{pt-BR,en,es}`. Termos do jogo (BAX, BAL, BAI, CTP,
  nomes de agentes) não são traduzidos.
