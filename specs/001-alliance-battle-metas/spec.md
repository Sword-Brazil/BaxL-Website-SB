# Feature Specification: Plataforma de Metas da Batalha de Aliança (Sword Brazil)

**Feature Branch**: `001-alliance-battle-metas`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Construa uma plataforma onde o usuário possa escolher os personagens e
uniformes que ele tem para cada dia de BAX e BAL, podendo selecionar os CTPs por meio de Drag and
Drop (os principais para modos PVE). A BAI funciona assim: todos os personagens estão disponíveis,
você escolhe seu melhor time e novos chefes vão aparecendo para serem derrotados um a um, pontuando o
máximo possível. Basear-se em https://guiabaxbal.web.app/ e https://thanosvibs.money/abxl, indo além
delas com design mais profissional e mais fácil de entender. Tela de usuário normal para ver os metas
de cada dia. A BAI aparece 2 dias após o início da nova semana. O último dia da semana anterior é
também o primeiro dia da próxima, pois o reset semanal ocorre às 22h (horário de Brasília). Não
definir tecnologia."

## Contexto do Domínio

- **Batalha de Aliança (BA)**: modo de *Marvel Future Fight* com três tipos de partida:
  **BAX** (Extrema), **BAL** (Lenda) e **BAI** (Infinita).
- **BAX e BAL** seguem um ciclo de **28 dias** (4 semanas de 7 dias). Cada dia tem uma
  **restrição**, formada por um ou mais critérios combinados com "E" (ex.: Vilão; Feminino +
  Mutante; ou "Sem restrição"), que define quais agentes podem ser usados. Os critérios
  possíveis incluem Herói, Vilão, Masculino, Feminino, Mutante, Inumano, Humano, Alienígena,
  Universal, Combate, Explosão e Velocidade. Na BAL existe também o modo livre, sem restrição.
- **Equipe**: 3 agentes — **1 Solador** (agente principal de dano) e **2 Suportes**.
- **Uniforme**: variação de um agente; a equipe Meta pode exigir um uniforme específico.
- **CTP**: item equipável. Os principais para PVE são **Fúria, Liberação, Percepção,
  Competição, Julgamento e Salto**, cada um com qualidades **Normal, Poderoso e
  Brilhante**.
- **BAI**: todos os agentes estão disponíveis. O jogador monta seu melhor time e enfrenta
  chefes em sequência, um de cada vez, somando a maior pontuação possível.
- **Calendário**:
  - O ciclo tem 28 dias numerados (4 semanas de 7 dias), e a semana começa na quinta-feira
    (Dia 1 = QUI).
  - A **virada de dia** acontece às **12h (horário de Brasília)**: cada dia de batalha vai das
    12h de uma data às 12h da data seguinte.
  - O **reset semanal da pontuação** acontece às **22h (BRT)**. Ele cai dentro de um dia de
    batalha, então esse dia é ao mesmo tempo o último da semana anterior (até 22h) e o primeiro
    da semana seguinte (depois das 22h). O **número do dia só muda às 12h**: às 22h muda apenas
    a semana para a qual a pontuação conta.
  - O **3º dia de cada semana** ("2 dias após o início", Dias 3, 10, 17 e 24) é o dia da
    **BAI**. Nele não há BAX nem BAL, e esses dias não aparecem na tabela de dias de BAX/BAL.

## Clarifications

### Session 2026-10-17

- Q: Como é a restrição de um dia na BAX/BAL? → A: Combinável (E). Uma restrição reúne um ou
  mais critérios de atributo que precisam valer ao mesmo tempo (ex.: "Feminino + Mutante").
  A lista completa das restrições por dia será enviada depois pelo usuário.
- Q: Num mesmo número de dia, BAX e BAL têm a mesma restrição? → A: Não. As restrições são
  independentes: cada modo tem sua própria restrição por dia (24 de BAX e 24 de BAL por ciclo).
- Q: Quem gerencia as permissões de curador? → A: Admin + Curadores. Um ou mais
  Administradores (ex.: liderança da Sword Brazil) promovem e removem Curadores. Curadores só
  editam e publicam conteúdo.
- Q: Como o usuário entra na conta? → A: Com e-mail e senha, em cadastro próprio da plataforma
  (com recuperação de senha). Vale para a conta opcional de sincronização e para Curadores e
  Administradores.
- Q: O conteúdo da BAI muda a cada semana? → A: Não. Há um conteúdo único de BAI (sequência de
  chefes e equipes recomendadas), o mesmo toda semana, editado pelos curadores quando o jogo muda.
- Q: No dia do reset semanal, quando muda o número do dia? → A: Só às 12h (BRT). Às 22h muda
  apenas a semana da pontuação, com aviso. Nenhum dia aparece duplicado.
- Q: Conta com e-mail não confirmado pode entrar? → A: Sim, pode entrar e sincronizar. Exigir a
  confirmação passará a valer quando houver envio real de e-mail.
- Q: Como a aba Admin recebe uploads de imagem? → A: Em base64 dentro do JSON (PNG/WebP, até 2 MB),
  sem lib nova.
- Q: Libs para rodar scripts TypeScript? → A: `tsx` e `@types/bcryptjs` autorizadas
  (dependências de desenvolvimento).

### Session 2026-10-18 (ajustes pedidos após a primeira implementação)

- BAX, BAL e BAI ficam numa **tela central única** com os 28 dias: BAX e BAL lado a lado por dia; nos
  dias de BAI, a BAI ocupa o dia inteiro. Não há aba "Hoje": o dia atual é indicado na própria tela
  (substitui as telas separadas de Hoje, BAX, BAL e BAI; rotas antigas redirecionam para `/`).
- Cada dia mostra a equipe **Meta** e a **Alternativa**. O usuário pode montar a própria equipe quando
  não tem as equipes, ou copiar a Meta/Alternativa com o que possui.
- O **CTP fica equipado no personagem** do usuário (como no jogo), não em cada equipe.
- Novos gráficos (`/estatisticas`): repetição de cada personagem por semana do ciclo e CTPs equipados
  (quantos e quais). Lib `recharts` autorizada (componente Chart do shadcn).
- Dados de base **importados do Guia BAX/BAL/BAI** com crédito: calendário de 28 dias (restrições),
  equipes Meta/Alternativa, 115 personagens e trajes. Atributos dos personagens deduzidos das
  restrições; o que faltar fica "não informado" e não bloqueia filtros. As equipes do guia trazem só o
  **tipo** do CTP (sem qualidade).
- Posições exibidas como **Líder / Pos. 1 / Pos. 2** (como no guia e no jogo).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar a equipe Meta do dia (Priority: P1)

Um membro da Sword Brazil abre a plataforma no celular durante a batalha. A plataforma mostra
logo o dia atual de BAX e BAL, já calculado pelo horário de Brasília. O membro vê a restrição do
dia, a equipe Meta (Solador + 2 Suportes, com uniformes) e o CTP Meta de cada agente. Ele também
pode navegar para qualquer outro dia de BAX/BAL do ciclo (1 a 28, exceto os dias de BAI).

**Why this priority**: é o propósito central da plataforma (Constituição, princípios II e V) e
já entrega valor sem nenhum recurso de personalização.

**Independent Test**: com as metas cadastradas, abrir a plataforma sem login e verificar que o
dia atual de BAX e BAL aparece com restrição, agentes, uniformes e CTPs, e que qualquer dia é
alcançável em no máximo 2 interações.

**Acceptance Scenarios**:

1. **Given** são 11h59 (BRT), **When** o usuário abre a plataforma, **Then** ela exibe como
   "Dia atual" o dia iniciado às 12h da véspera. **Given** são 12h00, **Then** exibe o dia
   seguinte.
2. **Given** é o dia de batalha em que ocorre o reset semanal, **When** o usuário o abre antes
   das 22h (BRT), **Then** ele aparece como último dia da semana corrente, com aviso de que a
   pontuação passa a contar para a nova semana às 22h. **When** o abre depois das 22h, **Then**
   ele mantém o mesmo número de dia, com o aviso "a pontuação agora conta para a nova semana".
   O número do dia só avança às 12h seguintes.
3. **Given** o usuário está na tela inicial, **When** escolhe BAL e o Dia 18, **Then** vê a
   restrição e a equipe Meta do Dia 18 da BAL em no máximo 2 interações.
4. **Given** um dia sem equipe cadastrada, **When** o usuário o abre, **Then** a plataforma
   mostra "Sem equipe definida" junto com a restrição do dia.
5. **Given** a BAL, **When** o usuário abre a seção "Modo livre", **Then** vê as equipes de
   melhor desempenho sem restrição, com a data da última atualização.

---

### User Story 2 - Marcar meus agentes e uniformes por dia (Priority: P2)

O usuário informa quais agentes e uniformes possui. Para cada dia de BAX e BAL, ele monta sua
própria equipe (Solador + 2 Suportes) entre os agentes que possui e que respeitam a restrição do
dia. A plataforma compara essa equipe com a equipe Meta, destacando o que coincide e o que falta.

**Why this priority**: é o diferencial em relação às referências: o jogador planeja sua batalha
com o próprio elenco, e não só lê a Meta.

**Independent Test**: marcar um elenco, montar a equipe de um dia e verificar que só aparecem
agentes permitidos pela restrição e que a comparação com a Meta está correta.

**Acceptance Scenarios**:

1. **Given** o Dia 4 da BAX tem restrição "Vilão", **When** o usuário escolhe agentes para esse
   dia, **Then** só aparecem agentes vilões que ele marcou como possuídos.
2. **Given** o Dia 6 da BAL tem restrição combinada "Feminino + Mutante", **When** o usuário
   escolhe agentes, **Then** só aparecem agentes possuídos que são femininos e mutantes.
3. **Given** a equipe Meta do dia exige um uniforme que o usuário não marcou, **When** ele vê a
   comparação, **Then** o agente aparece sinalizado como "uniforme Meta não possuído".
4. **Given** o usuário montou equipes para vários dias, **When** sai e volta à plataforma,
   **Then** suas seleções continuam salvas no dispositivo, mesmo sem login.
5. **Given** o usuário entrou com sua conta no celular e montou equipes, **When** entra com a
   mesma conta no computador, **Then** vê as mesmas seleções.
6. **Given** o Dia 5 da BAX tem uma Meta cujo Solador o usuário não possui, **When** ele abre o
   dia, **Then** a plataforma sugere a melhor equipe possível com o elenco dele, seguindo a lista
   de prioridade cadastrada pelos curadores para aquele dia.
7. **Given** o usuário quer recomeçar, **When** usa "Redefinir seleções" e confirma, **Then** as
   seleções do modo escolhido são apagadas e as dos outros modos são mantidas.

---

### User Story 3 - Atribuir CTPs com arrastar e soltar (Priority: P2)

Numa paleta de CTPs (os 6 tipos, cada um nas qualidades Normal, Poderoso e Brilhante), o usuário
arrasta um CTP e o solta sobre um agente da sua equipe de um dia. No celular há uma alternativa
por toque: tocar no CTP e depois no agente. O agente passa a mostrar o ícone e a qualidade do CTP,
e a plataforma indica se ele coincide com o CTP Meta.

**Why this priority**: o CTP é parte essencial da Meta e o usuário pediu explicitamente arrastar e
soltar.

**Independent Test**: arrastar "Fúria Brilhante" para o Solador de um dia e verificar que a
atribuição aparece, persiste e é comparada com o CTP Meta.

**Acceptance Scenarios**:

1. **Given** um agente sem CTP, **When** o usuário solta "Liberação Poderoso" sobre ele,
   **Then** o agente mostra o ícone de Liberação com a qualidade Poderoso.
2. **Given** um agente com CTP, **When** o usuário solta outro CTP sobre ele, **Then** o novo
   substitui o anterior (um CTP por agente por equipe).
3. **Given** um agente com CTP, **When** o usuário usa a ação "remover CTP", **Then** o agente
   fica sem CTP.
4. **Given** um dispositivo de toque, **When** o usuário toca num CTP e depois num agente,
   **Then** o resultado é o mesmo do arrastar e soltar.
5. **Given** o CTP atribuído é de tipo diferente do CTP Meta, **When** o usuário vê a equipe,
   **Then** a divergência é sinalizada.

---

### User Story 4 - Consultar a BAI (Priority: P3)

A BAI é um modo à parte que ocupa o 3º dia de cada semana, das 12h às 12h (BRT). A seção BAI
fica sempre acessível. Ela explica o modo e mostra as equipes recomendadas pela Sword Brazil
(escolhidas entre todos os agentes) e a sequência de chefes conhecida, com dicas por chefe quando
houver. Ela também sugere a melhor equipe possível com o elenco do usuário. No dia da BAI, a tela
inicial a destaca como "Hoje". Nos outros dias, a seção mostra a contagem para a próxima BAI.

**Why this priority**: a BAI é um modo especial e semanal, complementar a BAX e BAL.

**Independent Test**: simular datas no dia da BAI e fora dele e verificar o destaque, a contagem
e o conteúdo exibido.

**Acceptance Scenarios**:

1. **Given** é o Dia 2 da semana, **When** o usuário abre a BAI, **Then** vê o conteúdo e a
   data e hora (BRT) de início da próxima BAI.
2. **Given** é o 3º dia da semana entre 12h e 12h do dia seguinte, **When** o usuário abre a
   plataforma, **Then** a tela inicial destaca a BAI como modo do dia, com equipes, agentes,
   uniformes, CTPs e sequência de chefes.
3. **Given** a tabela de dias de BAX ou BAL, **When** o usuário a percorre, **Then** os dias de
   BAI (3, 10, 17, 24) não aparecem como dias de BAX/BAL.

---

### User Story 5 - Curadoria das Metas pela Sword Brazil (Priority: P1)

Um curador autorizado da Sword Brazil entra numa área restrita e cadastra ou edita: restrição e
equipe Meta de cada dia (BAX/BAL), equipes do modo livre da BAL, equipes e chefes da BAI, e o
catálogo de agentes, uniformes e CTPs. Ao publicar, a data de atualização é registrada.

**Why this priority**: sem conteúdo curado a plataforma não tem o que exibir (Constituição,
princípio IV).

**Independent Test**: o curador altera a equipe Meta de um dia e um usuário comum vê a mudança,
com a nova data de atualização, sem alteração de código.

**Acceptance Scenarios**:

1. **Given** um usuário sem permissão, **When** tenta acessar a área de curadoria, **Then** o
   acesso é negado.
2. **Given** um Administrador, **When** promove uma conta a Curador, **Then** essa conta passa a
   acessar a curadoria. **When** remove a permissão, **Then** o acesso é negado a partir da
   próxima ação.
3. **Given** um Curador sem papel de Administrador, **When** tenta promover ou remover outro
   Curador, **Then** a ação é negada.
4. **Given** um curador cadastra uma equipe com agente que não respeita a restrição do dia,
   **When** tenta publicar, **Then** a plataforma bloqueia e explica o motivo.
5. **Given** um curador publica uma alteração, **When** um usuário abre o dia, **Then** vê a
   nova equipe e a data da última atualização.

---

### Edge Cases

- Usuário com a página aberta durante a virada de dia (12h BRT) ou o reset semanal (22h BRT): o
  "Dia atual" deve se atualizar sem que o usuário precise recarregar manualmente.
- Conflito entre as seleções locais e as da conta ao entrar: o usuário escolhe quais manter, e
  nada é descartado sem confirmação.
- E-mail já cadastrado no cadastro, senha incorreta ou link de recuperação expirado: mostrar
  mensagens claras, sem revelar se um e-mail existe na plataforma.
- Muitas tentativas de login falhas seguidas: a plataforma limita novas tentativas
  temporariamente.
- Elenco do usuário sem nenhum agente das listas de prioridade do dia: a sugestão informa que
  não há equipe recomendável e orienta o usuário.
- Usuário em outro fuso horário: o dia atual é sempre calculado no horário de Brasília.
- Usuário sem nenhum agente que atenda à restrição do dia: mostrar mensagem orientando-o a
  marcar seu elenco, e não uma lista vazia.
- Agente ou uniforme removido ou renomeado no catálogo após o usuário tê-lo selecionado: a
  seleção não pode quebrar a tela; o item aparece como "indisponível".
- Equipe Meta alterada pelo curador depois de o usuário montar a equipe dele: a comparação passa
  a usar a nova Meta, e a equipe do usuário é mantida.
- Arrastar um CTP para fora de um alvo válido: nada muda.
- Dia com mais de uma equipe Meta (ex.: alternativa): todas são exibidas, com a principal
  destacada.

## Requirements *(mandatory)*

### Functional Requirements

**Calendário e navegação**

- **FR-001**: A plataforma MUST calcular o dia de batalha atual (1–28) pelo horário de Brasília,
  com virada às 12h00, e a semana corrente com reset semanal às 22h00.
- **FR-002**: O número do dia MUST mudar somente às 12h (BRT). No dia de batalha em que ocorre o
  reset semanal, a plataforma MUST indicar até 22h que a pontuação conta para a semana anterior
  e, a partir das 22h, avisar que a pontuação passou a contar para a nova semana, sem alterar o
  número do dia.
- **FR-003**: A plataforma MUST exibir cada dia de BAX/BAL com número e dia da semana
  (Dia 1 = QUI), permitir navegar para qualquer um deles e excluir da tabela de BAX/BAL os dias
  de BAI (3º dia de cada semana: 3, 10, 17, 24).
- **FR-004**: A plataforma MUST permitir chegar à equipe Meta de qualquer dia de BAX ou BAL em no
  máximo 2 interações a partir da tela inicial.
- **FR-005**: A plataforma MUST destacar a BAI como modo do dia durante o dia de BAI (12h–12h
  BRT) e, nos demais dias, mostrar data e hora de início da próxima BAI. O conteúdo da BAI fica
  consultável a qualquer momento.

**Exibição das Metas (público, sem login)**

- **FR-006**: Para cada dia de BAX e BAL, a plataforma MUST exibir a restrição, a(s) equipe(s)
  Meta (Solador + 2 Suportes), o uniforme Meta e o CTP Meta (tipo e qualidade) de cada agente.
- **FR-007**: A plataforma MUST exibir as equipes de melhor desempenho do modo livre da BAL em
  seção própria, separada dos dias.
- **FR-008**: A plataforma MUST exibir, na BAI, a explicação do modo, as equipes recomendadas e a
  sequência de chefes cadastrada.
- **FR-009**: Toda equipe exibida MUST mostrar a data da última atualização.
- **FR-010**: Agentes, uniformes e CTPs MUST aparecer com imagem/ícone e nome.
- **FR-011**: Dias sem equipe cadastrada MUST mostrar "Sem equipe definida".

**Elenco e equipes do usuário**

- **FR-012**: Usuários MUST poder marcar quais agentes e uniformes possuem, com busca por nome e
  filtros por restrição (gênero, lado, espécie, tipo de ataque).
- **FR-013**: Usuários MUST poder montar, para cada dia de BAX e BAL, uma equipe própria
  (Solador + 2 Suportes) escolhida entre os agentes que possuem e que atendem à restrição do dia.
- **FR-014**: A plataforma MUST comparar a equipe do usuário com a Meta do dia e indicar agentes,
  uniformes e CTPs coincidentes, divergentes ou não possuídos.
- **FR-015**: Usuários MUST poder atribuir CTPs aos agentes da sua equipe arrastando e soltando a
  partir de uma paleta com os 6 tipos de CTP PVE em 3 qualidades, com alternativa por toque.
- **FR-016**: Cada agente de uma equipe MUST ter no máximo um CTP. Soltar outro CTP substitui o
  anterior, e deve existir uma ação para remover o CTP.
- **FR-017**: As seleções do usuário (elenco, equipes, CTPs) MUST persistir no dispositivo sem
  exigir login, e o usuário MUST poder exportar e importar um backup delas.
- **FR-018**: Usuários MUST poder, opcionalmente, entrar com uma conta para sincronizar as
  seleções entre dispositivos. Ao entrar pela primeira vez, as seleções locais são levadas para a
  conta. Se já houver dados na conta, o usuário escolhe quais manter.
- **FR-019**: Contas MUST ser criadas com e-mail e senha, com confirmação do e-mail e
  recuperação de senha. Enquanto a plataforma roda só localmente, os links de confirmação e
  recuperação são exibidos no log do servidor, e Administradores podem redefinir senhas
  manualmente. Contas ainda não confirmadas podem entrar e sincronizar. Exigir a confirmação
  passará a valer quando houver envio real de e-mail. Senhas MUST NOT ser armazenadas em texto
  puro, e tentativas de login falhas repetidas MUST ser limitadas temporariamente.
- **FR-020**: Quando o usuário não possuir agentes ou uniformes da Meta, a plataforma MUST
  sugerir a melhor equipe possível com o elenco dele para aquele dia (e para a BAI). A sugestão
  segue listas de prioridade de Soladores e Suportes cadastradas pelos curadores e respeita a
  restrição do dia.
- **FR-021**: Usuários MUST poder redefinir suas seleções por modo (BAX, BAL, BAI), com
  confirmação.
- **FR-022**: Usuários MUST poder exportar uma imagem da sua equipe ou da tabela de dias para
  compartilhar.

**Curadoria**

- **FR-023**: Somente curadores autorizados da Sword Brazil MUST poder criar, editar e publicar
  metas, equipes do modo livre, conteúdo da BAI, listas de prioridade para sugestões e o catálogo
  de agentes, uniformes e CTPs.
- **FR-024**: Somente Administradores MUST poder promover e remover Curadores e
  Administradores, e a plataforma MUST impedir a remoção do último Administrador.
- **FR-025**: Curadores MUST poder cadastrar, separadamente para BAX e para BAL, a restrição de
  cada dia como uma combinação de um ou mais critérios de atributo que precisam valer ao mesmo
  tempo (ex.: "Feminino + Mutante").
- **FR-026**: A plataforma MUST validar, antes de publicar, que o dia está entre 1 e 28, que os
  agentes, uniformes e CTPs existem no catálogo e que a equipe respeita a restrição do dia.
- **FR-027**: Publicar uma alteração MUST registrar data e autor e refletir na visão pública sem
  alteração de código.

**Apresentação**

- **FR-028**: A interface MUST ter português do Brasil como idioma padrão e permitir trocar
  para inglês e espanhol, mantendo sem tradução os termos do jogo (BAX, BAL, BAI, CTP, nomes de
  agentes). MUST ter tema claro e escuro, ser projetada primeiro para celular e usar a
  identidade visual da Sword Brazil, inspirada em Marvel Future Fight, com logo, nome e favicon
  da aliança no cabeçalho e no título.
- **FR-029**: A plataforma MUST exibir o aviso de projeto de fã, não oficial e sem fins
  comerciais.
- **FR-030**: Cada tela MUST ter um texto curto de ajuda explicando como usá-la (ex.: legenda de
  cores de comparação e instrução do arrastar e soltar).

### Key Entities

- **Agente**: personagem jogável. Atributos: nome, imagem, gênero, lado (herói/vilão), espécie
  (mutante, inumano, humano, alienígena, …), tipo de ataque (combate, explosão, velocidade,
  universal). Possui um ou mais Uniformes.
- **Uniforme**: variação de um Agente. Atributos: nome, imagem e o Agente ao qual pertence.
- **CTP**: tipo (Fúria, Liberação, Percepção, Competição, Julgamento, Salto) ×
  qualidade (Normal, Poderoso, Brilhante), com ícone.
- **Restrição**: conjunto de um ou mais critérios de atributo (gênero, lado, espécie, tipo de
  ataque) combinados com "E": um agente atende à restrição só se atender a todos os critérios.
  "Sem restrição" é o conjunto vazio.
- **Dia de Batalha**: tipo de partida (BAX/BAL) + número (1–28) + dia da semana + Restrição.
  Identificado pelo par (tipo de partida, número). BAX e BAL têm Restrições independentes para
  o mesmo número de dia.
- **Equipe Meta**: Solador + 2 Suportes, cada um com Uniforme e CTP Meta. Pertence a um Dia de
  Batalha, ao modo livre da BAL ou à BAI. Tem data de atualização, autor e indicação de
  principal ou alternativa.
- **Chefe da BAI**: posição na sequência, nome, imagem e dicas opcionais. Existe uma única
  sequência de chefes da BAI, válida para todas as semanas até ser editada.
- **Elenco do Usuário**: Agentes e Uniformes que o usuário possui.
- **Equipe do Usuário**: para um Dia de Batalha, a escolha de Solador + 2 Suportes do usuário,
  com Uniforme e CTP de cada agente.
- **Lista de Prioridade**: para um Dia de Batalha (ou para a BAI), a ordem de preferência de
  Soladores e de Suportes (com uniforme e CTP recomendados), usada para gerar sugestões.
- **Conta do Usuário** (opcional): identifica o usuário para sincronizar seu Elenco e suas
  Equipes entre dispositivos. Atributos: e-mail (único), senha (nunca armazenada em texto puro),
  apelido no jogo (opcional) e papel (usuário, Curador ou Administrador).
- **Curador**: Conta do Usuário com permissão de criar, editar e publicar conteúdo.
- **Administrador**: Curador que também pode promover e remover Curadores e Administradores. Deve
  existir sempre pelo menos um Administrador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário vê a equipe Meta do dia atual em até 5 segundos após abrir a plataforma
  no celular, sem nenhuma interação.
- **SC-002**: Qualquer dia de BAX ou BAL é alcançado em no máximo 2 interações a partir da tela
  inicial.
- **SC-003**: Em testes com membros da aliança, pelo menos 90% conseguem montar sua equipe de um
  dia e atribuir CTPs na primeira tentativa, sem ajuda externa.
- **SC-004**: O "Dia atual", a semana corrente e o dia de BAI estão corretos em 100% dos testes
  em torno das 12h (virada de dia) e das 22h (reset semanal), no horário de Brasília, inclusive
  para usuários em outros fusos.
- **SC-005**: Um curador atualiza a equipe Meta de um dia em menos de 2 minutos, e a mudança
  fica visível ao público imediatamente após a publicação.
- **SC-006**: Pelo menos 80% dos membros consultados avaliam a plataforma como "mais fácil de
  entender" que as referências (guiabaxbal e thanosvibs).
- **SC-007**: Nenhuma equipe publicada viola a restrição do seu dia (0 ocorrências).
- **SC-008**: Em 100% dos casos em que o usuário tem ao menos um agente das listas de prioridade
  que atende à restrição do dia, a plataforma apresenta uma sugestão de equipe.

## Assumptions

- O ciclo tem 28 dias numerados, a semana começa na quinta-feira e as restrições de cada dia são
  fixas no ciclo e cadastradas pelos curadores. A lista completa de restrições por dia será
  fornecida pelo usuário depois e não bloqueia o desenvolvimento. Os dias 3, 10, 17 e 24 são de BAI, então BAX e
  BAL têm 24 dias com conteúdo por ciclo.
- A virada de dia é às 12h (BRT) e o reset semanal da pontuação é às 22h (BRT). A data de
  referência do início do ciclo (qual quinta-feira é o Dia 1) é cadastrada pelos curadores.
- Equipes têm 3 agentes (1 Solador + 2 Suportes), como nas referências.
- Os "principais CTPs para PVE" são os 7 listados, cada um com 3 qualidades.
- O catálogo de agentes, uniformes e CTPs é mantido manualmente pelos curadores. Não há integração
  com o jogo nem com as contas dos jogadores (Constituição, Restrições de Domínio).
- A visão pública das metas e a personalização local não exigem login. A conta (e-mail e senha)
  é opcional, só para sincronizar, e a curadoria exige login com papel de Curador.
- O conteúdo da BAI é único e vale para todas as semanas. Não há histórico por semana.
- As sugestões seguem as listas de prioridade dos curadores. Não há cálculo de dano nem
  simulação de batalha.
- Fora de escopo nesta feature: rankings, chat, calculadora de dano e outros modos de jogo além
  da Batalha de Aliança.
