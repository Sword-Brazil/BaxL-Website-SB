# Research: Plataforma de Metas da Batalha de Aliança

**Feature**: `001-alliance-battle-metas` | **Date**: 2026-10-17

Decisões tomadas a partir do input do `/speckit-plan` e das respostas do usuário em 2026-10-17.
Regra do usuário: **toda lib não listada aqui precisa de autorização antes de ser adicionada**.

## R1. Framework web

- **Decision**: Next.js (React) com **Pages Router** e TypeScript.
- **Rationale**: "React.js Pages Router" é o roteador por arquivos do Next.js (`pages/`). As API
  Routes (`pages/api`) dão o backend no mesmo projeto, sem um servidor separado.
- **Alternatives considered**: App Router (descartado: o usuário pediu Pages Router); React + Vite
  com Express separado (dois projetos, mais configuração).

## R2. UI e design system

- **Decision**: Tailwind CSS v4 + **shadcn/ui** (https://ui.shadcn.com) como base de todos os
  componentes. O que o shadcn não tem vem de registries compatíveis com a CLI do shadcn:
  **Origin UI** (coss) e **Magic UI**. Nenhum componente visual é criado do zero. Só tema,
  tokens e variantes são customizados.
- **Rationale**: o usuário pediu explicitamente. Os componentes do shadcn são copiados para o
  repositório, o que permite restilizar sem fork.
- **Design "MFF/MCU"**: aplicado só por tokens CSS (`@theme` do Tailwind v4) e variantes:
  - Base escura azul-marinho/metálica, inspirada nos menus do MFF.
  - Acentos dourado e ciano-energia.
  - Cor por alinhamento: **Herói** azul, **Vilão** vermelho/roxo, **Anti-herói** âmbar.
  - Cantos chanfrados (`clip-path`) em Card/Button, brilho nas bordas e cor por raridade de CTP:
    Normal, Poderoso e Brilhante.
  - Fontes do Google Fonts via `next/font` (sem lib nova): título "Oxanium", texto "Inter".
  - Tema claro com a mesma identidade, invertendo as superfícies.
- **Alternatives considered**: MUI/Chakra (fogem do shadcn pedido).

## R3. Idiomas

- **Decision**: **next-i18next** (escolha do usuário; traz `i18next` e `react-i18next` como
  dependências obrigatórias). Locales: `pt-BR` (padrão), `en`, `es`, com o roteamento de idioma
  nativo do Pages Router (`/en/...`, `/es/...`).
- **Rationale**: suporte maduro ao Pages Router com `serverSideTranslations`.
- **Note**: os nomes do jogo (BAX, BAL, BAI, CTP, nomes de agentes) não são traduzidos.
- **Alternatives considered**: next-intl (recomendado inicialmente, preterido pelo usuário).

## R4. Tema claro/escuro

- **Decision**: `next-themes` (padrão do shadcn), com escuro como padrão e a preferência
  salva no aparelho.

## R5. Persistência (sem banco em nuvem)

- **Decision**: **SQLite** em arquivo local + **Prisma** ORM (`prisma`, `@prisma/client`).
- **Rationale**: o usuário não quer serviço em nuvem, pago ou que exija login periódico.
  SQLite é um arquivo, gratuito e sem servidor, e o backup é copiar o arquivo. Prisma foi
  escolhido pelo usuário em vez de Drizzle.
- **Constraints**:
  - Por enquanto, execução **apenas local**.
  - Um deploy futuro exige host com disco persistente (VPS/Docker). Vercel não serve.
  - Campos de "enum" são `String` validados por Zod, para portabilidade no SQLite.
  - Os critérios de restrição ficam em tabela própria, em vez de JSON.
- **Alternatives considered**: Supabase/Firebase (nuvem, recusados); Drizzle (preterido).

## R6. Autenticação e papéis

- **Decision**:
  - Login por e-mail e senha.
  - Senha com hash **bcryptjs**, custo 12.
  - Sessão em cookie criptografado httpOnly com **iron-session**.
  - Papéis `USER`, `CURATOR` e `ADMIN`, verificados em cada API Route de escrita.
  - Limite de tentativas: tabela `LoginAttempt` (5 falhas por e-mail+IP em 15 min geram bloqueio
    de 15 min), sem lib extra.
  - A conta de usuário comum é mantida (decisão do usuário) para sincronizar elenco e equipes.
  - Contas ainda não confirmadas **podem entrar e sincronizar**. Exigir a confirmação passa a
    valer quando houver envio real de e-mail.
- **E-mail (confirmação e recuperação)**: não há serviço de e-mail no modo local. A interface
  `MailService` tem uma implementação **console** que escreve os links no log do servidor.
  Enviar e-mails de verdade exigirá uma lib (ex.: `nodemailer`) e um SMTP, que serão pedidos
  ao usuário quando houver hospedagem. Admins também podem redefinir a senha de um usuário pela
  aba Admin.
- **Contas iniciais**: `prisma db seed` cria **uma conta ADMIN e uma conta USER** para o dono do
  projeto. E-mails e senhas vêm de `.env.local` (`SEED_ADMIN_*`, `SEED_USER_*`) e nunca ficam no
  código.
- **Alternatives considered**: Auth.js Credentials (mais configuração para o mesmo resultado).

## R7. Validação

- **Decision**: **Zod** em todos os inputs (login, cadastro, novos admins, metas, restrições),
  compartilhado entre o formulário (`react-hook-form` + `@hookform/resolvers`, padrão do Form do
  shadcn) e as API Routes.

## R8. Arquitetura MVVM

- **Decision**:
  - **Model**: tipos de domínio, schemas Zod, regras puras (calendário, restrição, sugestão) e
    clientes de API. No servidor: repositórios Prisma e serviços.
  - **ViewModel**: hooks `use*ViewModel` que expõem estado e comandos para a View. Usam
    **TanStack Query** para dados do servidor e **Zustand** (`persist`) para o elenco, as equipes
    e os CTPs guardados no aparelho.
  - **View**: páginas do Pages Router e composições de componentes shadcn, sem lógica de negócio.
- **Rationale**: separa regra de jogo testável de apresentação. As Views só renderizam o que o
  ViewModel entrega.

## R9. Arrastar e soltar

- **Decision**: **@dnd-kit/core**, com sensores de ponteiro, toque e teclado. A alternativa
  "tocar no CTP e depois no agente" usa o mesmo comando do ViewModel.

## R10. Exportar imagem

- **Decision**: **html-to-image**, exportando o nó da equipe ou da tabela para PNG.

## R11. Imagens de CTPs e agentes

- **Decision**:
  - As imagens são **copiadas para o nosso storage local** (`public/assets/ctp/`,
    `public/assets/agents/<agente>/<uniforme>.png`).
  - O script `scripts/import-assets.ts` (usa o `fetch` nativo, sem lib) baixa uma vez as imagens
    a partir de um manifesto de URLs de referência (thanosvibs). Os ícones de CTP de lá já são
    PNG com fundo transparente.
  - Admins podem enviar ou trocar imagens pela aba Admin. O upload vai **em base64 no corpo JSON**
    (PNG/WebP, até 2 MB depois de decodificado), sem lib de multipart, e é salvo em
    `public/assets/uploads/`.
- **Notes**:
  - As imagens são assets de *Marvel Future Fight* (Netmarble/Marvel), usados sob o aviso de
    projeto de fã (Constituição).
  - Recomenda-se avisar ou pedir ok ao mantenedor do thanosvibs antes da importação.
  - O script respeita um intervalo entre downloads e não roda em produção.
- **Alternatives considered**: hotlink (frágil e consome banda de terceiros); só upload manual
  (trabalhoso).

## R12. Horário de Brasília

- **Decision**: cálculo puro no Model, com `Intl.DateTimeFormat` e `timeZone:
  "America/Sao_Paulo"` (sem lib de datas).
  - O dia de batalha vira às 12:00 e a semana às 22:00. O **número do dia muda só às 12:00**:
    às 22:00 do dia de reset muda apenas a semana da pontuação (`weekIndex`).
  - A âncora do ciclo (instante de início do Dia 1) fica em `Settings` e é editável pelo admin.
  - O cliente recalcula a cada minuto, para que a virada apareça sem recarregar a página.

## R13. Testes

- **Decision (AUTORIZADO em 2026-10-17)**: **Vitest** para testes unitários do Model (calendário,
  restrições, sugestão, schemas Zod) e dos ViewModels. A Constituição exige testes automatizados
  das regras de domínio.
- **Alternatives**: Jest (mais configuração com ESM/TS). Playwright para E2E ficaria para depois,
  também sujeito a autorização.

## Resumo de dependências

| Lib | Origem da aprovação |
|-----|---------------------|
| next, react, react-dom, typescript | Pedido do usuário (React Pages Router) |
| tailwindcss v4, shadcn/ui (+ radix-ui, class-variance-authority, clsx, tailwind-merge) | Pedido do usuário |
| Origin UI, Magic UI (via registry do shadcn; Magic UI usa `motion`) | Pedido do usuário |
| zod | Pedido do usuário |
| next-i18next (+ i18next, react-i18next) | Autorizado em 2026-10-17 |
| next-themes, react-hook-form, @hookform/resolvers, lucide-react | Autorizado ("padrão do shadcn") |
| @dnd-kit/core | Autorizado |
| @tanstack/react-query, zustand | Autorizado |
| html-to-image | Autorizado |
| prisma, @prisma/client (SQLite) | Autorizado (escolha do usuário) |
| bcryptjs, iron-session | Autorizado junto com Prisma |
| tsx (dev) | Autorizado em 2026-10-17 (`@types/bcryptjs` dispensado: bcryptjs 3 já traz tipos) |
| recharts (via componente Chart do shadcn) | Autorizado em 2026-10-18 |
| vitest | Autorizado em 2026-10-17 |
| jsdom + @testing-library/react (testar hooks de ViewModel) | **Pendente**. Sem elas, os testes cobrem Model e services em ambiente Node |
| nodemailer (futuro, envio real de e-mail) | **Pendente**, só quando houver hospedagem |
