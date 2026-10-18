<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0 (MINOR: principles expanded, no principle removed)
Modified principles:
  - II. O Dia da Batalha como Unidade Central: ciclo de 28 dias com o 3º dia de cada semana
    reservado à BAI; estrutura da BAI definida (resolve TODO(BAI_RULES))
  - III. Feito para a Sword Brazil: PT-BR como idioma padrão, outros idiomas permitidos
  - IV. Conteúdo Curado, Datado e Separado do Código: papéis Administrador/Curador
    (resolve TODO(CURATORS)); dias válidos excluem os dias de BAI
Modified sections:
  - Restrições de Domínio e Conteúdo: conta opcional de jogador com dados mínimos
  - Fluxo de Desenvolvimento e Qualidade: validação de dia exclui dias de BAI
Added/removed sections: none
Templates: not modified.
Follow-up TODOs: none
-->

# MFF System — Sword Brazil Constitution

## Core Principles

### I. Fidelidade ao Domínio de Marvel Future Fight

O sistema modela o modo **Batalha de Aliança** do jogo mobile *Marvel Future Fight* (MFF)
e DEVE usar a terminologia do jogo de forma consistente em código, dados e interface:

- Os três tipos de partida são **BAX** (Batalha de Aliança Extrema), **BAL** (Batalha de
  Aliança Lenda) e **BAI** (Batalha de Aliança Infinita); nenhum outro tipo pode ser
  inventado sem emenda a esta constituição.
- **Agente** é o personagem jogável; **CTP** é o item equipável recomendado para cada agente;
  **Meta** é a equipe (e seus CTPs) que entrega a melhor pontuação em um contexto.
- Nomes de agentes, uniformes e CTPs DEVEM corresponder aos nomes oficiais do jogo
  (com grafia única e normalizada no sistema).

**Racional**: os usuários são jogadores experientes; termos ambíguos ou inventados
geram desconfiança e erros na hora de montar a equipe.

### II. O Dia da Batalha como Unidade Central

- O ciclo tem **28 dias** (4 semanas de 7). O **3º dia de cada semana** (Dias 3, 10, 17 e
  24) é da **BAI** e não tem BAX nem BAL. Os demais **24 dias** de cada modo (BAX e BAL)
  DEVEM poder exibir sua(s) equipe(s) Meta, com os agentes e o **CTP Meta de cada agente**.
- Em **BAL**, além das equipes Meta por dia, o sistema DEVE suportar as **equipes de melhor
  desempenho** do modo livre (sem restrição de personagem), tratadas como um conjunto
  próprio que muda com baixa frequência e não precisa ser duplicado em cada dia.
- **BAI**: todos os agentes estão disponíveis e o jogador enfrenta chefes em sequência,
  um a um. O sistema DEVE exibir a sequência de chefes e as equipes recomendadas, como
  conteúdo único válido para todas as semanas até ser editado.
- Um dia sem equipe cadastrada DEVE ser exibido explicitamente como "sem equipe definida",
  nunca como erro ou tela vazia.

**Racional**: o jogador abre o sistema pensando "qual equipe uso hoje?"; o dia é a chave
natural de navegação e de modelagem dos dados.

### III. Feito para a Sword Brazil

- O público-alvo é a aliança **Sword Brazil**, top global da Batalha de Aliança. As equipes
  exibidas DEVEM refletir as escolhas e estratégias da aliança, não um agregado genérico
  da comunidade.
- **Português do Brasil** é o idioma padrão da interface e DEVE estar sempre completo.
  Outros idiomas são permitidos. Siglas e nomes do jogo (BAX, BAL, BAI, CTP, agentes) NÃO
  DEVEM ser traduzidos.
- A identidade visual DEVE representar a Sword Brazil.

**Racional**: o valor do sistema está em centralizar o conhecimento de uma aliança de
elite para seus membros; generalizar dilui esse propósito.

### IV. Conteúdo Curado, Datado e Separado do Código

- Equipes, agentes e CTPs são **dados**, não código: alterar uma equipe Meta NÃO DEVE
  exigir mudança de código-fonte nem novo deploy de lógica.
- Toda equipe publicada DEVE registrar a **data da última atualização** e, quando
  aplicável, a temporada/versão do jogo a que se refere, e essa data DEVE ser visível
  ao jogador.
- Somente **Curadores** podem publicar ou alterar conteúdo. **Administradores**
  (liderança da Sword Brazil) promovem e removem Curadores e DEVE existir sempre ao menos
  um Administrador. O conteúdo DEVE ser validado (agente existente, CTP existente, dia
  válido de BAX/BAL, restrição respeitada) antes de ser publicado.

**Racional**: o Meta muda a cada atualização do jogo; dados desatualizados ou inválidos
custam pontos à aliança. Atualização fácil e datada mantém a confiança.

### V. Consulta Rápida e Mobile-First

- O jogador consulta o sistema no celular, geralmente com o jogo aberto. A interface
  DEVE ser projetada primeiro para telas de celular.
- A partir da tela inicial, o jogador DEVE chegar à equipe Meta de um dia específico de
  BAX ou BAL em no máximo **2 interações**.
- Agentes e CTPs DEVEM ser identificáveis visualmente (imagem/ícone e nome) para
  reconhecimento imediato.

**Racional**: a consulta acontece durante a janela de batalha; fricção na navegação
significa tempo e pontuação perdidos.

### VI. Simplicidade (YAGNI)

- Cada funcionalidade DEVE servir ao objetivo central: exibir as principais equipes de
  cada dia para a Sword Brazil. Recursos fora disso (rankings, chat, simuladores de dano,
  integração com contas do jogo) exigem justificativa explícita no plano da feature.
- Prefira a solução mais simples que atenda aos princípios I–V; complexidade adicional
  DEVE ser registrada e justificada na seção de complexidade do plano.

**Racional**: um projeto de comunidade precisa ser fácil de manter por poucas pessoas.

## Restrições de Domínio e Conteúdo

- Projeto de fã, **não oficial** e **sem fins comerciais**. *Marvel Future Fight* é
  propriedade da Netmarble e os personagens são propriedade da Marvel; o sistema DEVE
  exibir esse aviso e NÃO DEVE se apresentar como produto oficial.
- O sistema NÃO DEVE coletar credenciais de conta do jogo nem interagir com os
  servidores do jogo.
- Dados pessoais DEVEM se limitar ao necessário para autenticar: e-mail, hash de senha e
  apelido opcional. A conta é opcional para jogadores (sincronização entre aparelhos) e
  obrigatória para Curadores e Administradores. Senhas NUNCA são armazenadas em texto puro.

## Fluxo de Desenvolvimento e Qualidade

- Toda feature segue o fluxo Spec Kit: `/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`, e o plano DEVE conter um "Constitution Check"
  verificando os princípios I–VI.
- Regras de validação de domínio (dia válido de BAX/BAL, calendário em horário de
  Brasília, tipo de partida, restrição, agente e CTP existentes) DEVEM ter testes
  automatizados.
- Mudanças que alterem o modelo de dados de equipes DEVEM preservar ou migrar o
  conteúdo já cadastrado.

## Governance

- Esta constituição prevalece sobre outras práticas do projeto. Specs, planos e revisões
  DEVEM verificar conformidade com ela.
- Emendas são feitas via `/speckit-constitution`, com Sync Impact Report, e registradas
  no histórico do git.
- Versionamento semântico: **MAJOR** para remoção ou redefinição incompatível de princípios;
  **MINOR** para novo princípio/seção ou expansão material; **PATCH** para esclarecimentos
  e correções de redação.
- Revisões de código e de spec DEVEM apontar violações; exceções exigem justificativa
  escrita no plano da feature.

**Version**: 1.1.0 | **Ratified**: 2026-10-17 | **Last Amended**: 2026-10-17
