# Pontuações da Sword na BA: proposta em stand-by

**Status:** em espera. Precisa da aprovação dos demais ADMs antes de virar spec (`/speckit-specify`) e entrar em desenvolvimento.
**Registrado em:** 22/10/2026
**Referência:** o sistema atual da aliança, [Sword Alliance Tracker](https://swordtabelas.web.app/)

## Objetivo

Uma área do site para as pontuações de cada membro da Sword na Batalha de Aliança. Cada membro vê a própria evolução em gráficos (componentes de gráfico e blocos de dashboard do shadcn/ui), e os ADMs gerenciam as pontuações e as faixas da aliança. A área segue o padrão de configuração do sistema atual e acrescenta o que ele não tem.

## O que o sistema atual faz (para manter)

Lido em 22/10/2026 na página pública, sem acesso ao código.

| Área | O que tem |
|---|---|
| **Membros** | Lista global com Rank, Jogador, Aliança, Última pontuação e "Vs. Rotação (Mês)". Busca, ordenação ("Média 2 sem.", "Recente", "Nome A-Z"), seleção múltipla para mover ou excluir, e perfil com "Evolução & Histórico" (Data, Pontuação, Variação). |
| **Colar** | Importação em texto ("Nick: Pontos", "Nick - Pontos" ou só o nick), com semana de referência e aliança de destino. |
| **Dados** | Correção de data, exclusão de pontuações de uma data, edição de pontuação e visibilidade pública por aliança. |
| **Cofre** | Inativos ("Câmara Criogênica", fora dos rankings) e excluídos (pontuações com mais de 3 meses são ignoradas ao restaurar). |
| **Exportar** | Imagem do ranking por semana, ano e alianças (Sword Brasīl, SW0RD BR, Dynasty BRASĪL). |
| **Ranking** | Faixas Top 1–40 (Elite), 41–80 (Veteranos) e 81–120 (Ascensão). |
| **Transferências** | Sugestões pela média das últimas 2 semanas, movimentações pendentes para aprovar ou cancelar, e imagem das movimentações. |

A unidade é a **semana de jogo**. Não há divisão por modo (BAX/BAL/BAI).

## Proposta para este sistema

### Telas

1. **Minhas pontuações** (membro logado). Usa os blocos de dashboard do shadcn (`dashboard-01`: cartões de resumo, gráfico de área interativo e tabela de dados). O projeto já tem `src/components/ui/chart.tsx` com Recharts.
   - Cartões: última semana, média de 2 semanas, melhor semana, posição e faixa atual, variação contra a mesma semana do mês anterior.
   - Gráfico de área: evolução semanal, com linha da média da aliança e da faixa de corte (Top 40/80/120).
   - Gráfico de barras: pontuação por modo (BAX, BAL, BAI) e por dia do ciclo, se os dados por modo forem registrados.
   - Gráfico radial: percentil na aliança.
2. **Ranking** (todos os membros): faixas Elite, Veteranos e Ascensão, filtro por semana e aliança, e exportação em imagem e HTML, igual aos exports atuais.
3. **Admin → Pontuações**: importação em texto (formatos do sistema atual), correções por data, inativos e excluídos, visibilidade, e transferências com aprovação.

### O que o sistema atual não tem (melhorias)

- **Conta ligada ao membro:** cada membro vê as próprias pontuações ao entrar, sem procurar o nick numa lista.
- **Pontuação por modo e por dia**, ligada ao ciclo de 28 dias que o site já tem. Mostra em quais dias o membro rende menos e qual Meta era a do dia.
- **Pontuação × equipe usada:** cruza a pontuação do dia com a equipe que o membro montou e com a Meta. Indica quando seguir a Meta rende mais.
- **Metas pessoais e alertas:** o membro define uma meta semanal. O admin é avisado de quedas fortes (ex.: abaixo de 70% da média de 2 semanas) antes da transferência.
- **Sugestão de faixa explicada:** a sugestão de transferência mostra o motivo (média, tendência, semanas ativas) e não só o resultado.
- **Histórico de alterações (auditoria):** quem importou, corrigiu ou moveu cada pontuação, e quando.
- **Importação mais fácil:** além de colar texto, aceitar CSV. No futuro, leitura de captura de tela do ranking do jogo (OCR), sempre com revisão antes de confirmar.
- **O que este site já oferece:** pt-BR, EN e ES, celular, tema claro e escuro, indicadores de carregamento, e o mesmo login e os mesmos papéis (ADM/Curador/Jogador).

### Dados (rascunho)

- `AllianceMember`: nick (IGN), aliança (Sword Brasīl, SW0RD BR, Dynasty BRASĪL, sem guilda), status (ativo, parado, excluído) e `userId` opcional (conta ligada).
- `ScoreEntry`: membro, semana de jogo (início), pontos, modo e dia opcionais, origem (colar, CSV, manual) e quem registrou.
- `Transfer`: membro, de → para, status (pendente, aprovada, cancelada), semana, quem aprovou.
- `ScoreAudit`: ação, antes/depois, autor e data.

### Perguntas para os ADMs

1. Migrar o histórico do sistema atual? Ele está no Firebase; é preciso exportar.
2. As pontuações por modo e por dia existem, ou só o total semanal?
3. O ranking fica visível para todos os membros ou só a própria pontuação, mais as faixas?
4. As três alianças (Sword Brasīl, SW0RD BR e Dynasty BRASĪL) entram, ou só a Sword Brasīl?
5. O sistema atual continua em paralelo durante a transição?

## Próximos passos (depois da aprovação)

1. Responder às perguntas acima.
2. `/speckit-specify` com esta proposta, depois `/speckit-plan` e `/speckit-tasks`.
3. Começar pela importação e pela tela "Minhas pontuações". Ranking e transferências vêm depois.
