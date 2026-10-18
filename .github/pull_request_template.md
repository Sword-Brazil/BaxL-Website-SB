<!--
PRs de branches de trabalho (feat/, fix/, docs/, chore/) vão para a `Dev`.
Só a `Dev` vai para a `master` (Constituição — Fluxo de Desenvolvimento e Qualidade).
-->

## Resumo

<!-- O que muda e por quê, em 2–4 frases, do ponto de vista de quem usa a plataforma. -->

## Tipo de mudança

- [ ] Funcionalidade (`feat/`)
- [ ] Correção de bug (`fix/`)
- [ ] Documentação / specs (`docs/`)
- [ ] Manutenção (`chore/`)
- [ ] Integração `Dev` → `master`

## O que mudou

<!-- Lista curta por área (tela pública, admin, API, banco, specs). Uma linha por item. -->

-

## Issues

<!-- Uma por linha: "Closes #N" fecha a issue ao entrar na branch padrão; "Refs #N" só referencia. -->

- Closes #

## Banco de dados

- [ ] Sem mudanças no banco
- [ ] Nova migração (`prisma/migrations/...`) — preserva o conteúdo já cadastrado
- [ ] Exige reiniciar o `npm run dev` depois de `prisma migrate` (Prisma Client regenerado)

## Como testar

<!-- Passos curtos; inclua a tela no celular (390px) quando houver interface. -->

1.

## Checklist

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run check:locales` (pt-BR, en e es com as mesmas chaves)
- [ ] `npm run build`
- [ ] Testado no celular (390px) e no PC, temas claro e escuro
- [ ] Spec e `tasks.md` atualizados quando a regra ou o escopo mudou
- [ ] Funcionalidade incompleta sinalizada com aviso de "em desenvolvimento" (FR-031/FR-032)
- [ ] Commits separados por assunto

## Capturas de tela

<!-- Antes/depois, quando houver mudança visual. -->
