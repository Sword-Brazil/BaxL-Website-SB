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
- Nenhum serviço externo: o banco é SQLite em arquivo (`prisma/dev.db`).

## Configuração

```bash
npm install
cp .env.example .env.local     # preencha SESSION_SECRET e as contas do seed
echo 'DATABASE_URL="file:./dev.db"' > .env   # lido pela CLI do Prisma
npx prisma migrate dev         # cria o banco
npx prisma db seed             # CTPs, 48 dias de BAX/BAL, configurações e as contas ADMIN e USER
npm run dev                    # http://localhost:3000
```

Variáveis em `.env.local`:

| Variável | Uso |
|----------|-----|
| `SESSION_SECRET` | ≥ 32 caracteres aleatórios. Sem ele o servidor não inicia. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Sua conta de Administrador. |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | Sua conta de usuário comum. |
| `APP_URL` | Base dos links de confirmação de e-mail e de redefinição de senha. |

Rodar `npx prisma db seed` de novo é seguro: ele não duplica nada e atualiza a senha das contas do seed.

## Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento. |
| `npm test` | Testes (Vitest): regras de calendário, restrição, comparação, sugestão, schemas e services. |
| `npm run build` / `npm start` | Build e servidor de produção. |
| `npx prisma db seed` | Dados base e contas. |
| `npm run import:guiabaxbal [-- --replace]` | Importa o snapshot do Guia BAX/BAL/BAI (`prisma/data/`): calendário de 28 dias, 115 personagens e trajes, equipes Meta e Alternativa de BAX/BAL/BAI. `--replace` substitui as equipes existentes. |
| `npm run import:images` | Copia as fotos de `img/` (personagens, CTPs e ícones de restrição) para `public/assets` e liga cada retrato ao traje, conforme `prisma/data/images.json`. Rode depois de `import:guiabaxbal`. |
| `npm run seed:demo` | **Só para desenvolvimento**: 12 agentes e 3 equipes Meta de exemplo (não use junto com a importação). |
| `npm run assets:import` | Baixa as imagens de `scripts/assets-manifest.json` para `public/assets/`. Avise o mantenedor do site de origem antes de rodar. |
| `npm run check:locales` | Confere se PT-BR, EN e ES têm as mesmas chaves de tradução. |

## Uso

- **Público** (sem login): `/` é a tela central da Batalha de Aliança, com os 28 dias, BAX e BAL lado
  a lado (Meta e Alternativa), a BAI ocupando o dia inteiro e o dia atual destacado. Também há
  `/meu-elenco` (personagens, trajes e CTPs equipados), `/estatisticas` (gráficos) e `/bal/livre`.
- **Conta opcional**: sincroniza o elenco e as equipes entre aparelhos. Sem conta, tudo fica salvo no
  aparelho, com exportar e importar backup em JSON.
- **Admin** (`/admin`, Curadores e Administradores): restrições dos dias, equipes Meta, listas de
  prioridade, catálogo e imagens, e chefes da BAI. Usuários e configurações do calendário são só para
  Administradores.
- **Calendário** (horário de Brasília): o dia vira às 12h, o reset semanal da pontuação é às 22h e o
  3º dia de cada semana é a BAI. Ajuste a âncora do ciclo em `/admin/config` se o "Dia atual" estiver
  diferente do jogo.
- **E-mail**: sem servidor de e-mail no modo local. Os links de confirmação e de recuperação aparecem
  no log do servidor, e Administradores podem redefinir senhas em `/admin/usuarios`.

## Backup

Todo o conteúdo fica em `prisma/dev.db` (e as imagens enviadas, em `public/assets/uploads/`).
Para fazer backup, copie esses arquivos com o servidor parado.

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
