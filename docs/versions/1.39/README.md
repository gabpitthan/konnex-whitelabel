# Versão 1.39 — o núcleo emaranhado aberto: 133 → 26 arquivos

Data: 2026-08-08
Estado: gate aprovado, implantada, sessão WhatsApp verificada
Risco: alto — mexe no fluxo de controle da sessão do WhatsApp

## Resultado

| | antes | depois |
|---|---|---|
| Maior componente cíclico | **133 arquivos** | **26** |
| Arquivos sem nenhum ciclo | 470 | **589** |
| Arestas que sobem de camada | 9 | **0 reais** |

Redução de 80% no núcleo. As seis arestas reais foram cortadas; as duas que o
grafo ainda mostra são uma **aresta falsa do extrator** (detalhe abaixo).

## As seis correções

**1–2. Serviço dependia de controller** (feito na 1.38)
`sendMessageFlow` saiu de `MessageController` para
`services/MessageServices/SendMessageFlowService.ts`.

**3–4. Infraestrutura chamava serviço em runtime** — a parte de risco.

`libs/wbot.ts` chamava `StartWhatsAppSession` (reconexão) e
`ImportWhatsAppMessageService` (importação de histórico) diretamente. Inverteu-se
com `libs/sessionHooks.ts`: `wbot.ts` passa a depender de duas assinaturas que
ele mesmo declara, e `server.ts` — que já é o ponto de composição, onde as
sessões começam — fornece as implementações.

O registro **falha alto**: gancho ausente emite `session_hook_not_registered` no
log com o nome do gancho. Sessão que não reconecta em silêncio é o pior modo de
falha possível neste produto, e essa era a armadilha óbvia dessa inversão.

**5. Funções puras presas num arquivo de 5.400 linhas**
`getTypeMessage` e `isValidMsg` classificam uma mensagem: sem estado, sem banco,
sem sessão. Foram para `helpers/WhatsappMessageType.ts`. O listener e o
`libs/wbot.ts` importam de lá.

**6. Composição de fila na pasta de infraestrutura**
`libs/queue.ts` importava `../jobs` para montar as filas Bull. Não era
infraestrutura — só existe para casar handler de job com fila, e é consumido por
serviços. Passou a ser `jobs/bullQueues.ts`.

**Os dois helpers mal posicionados** (`SendMessage`, `UpdateDeletedUserOpenTicketsStatus`)
eram serviços em `helpers/`. Moveram-se para `services/MessageServices/` e
`services/TicketServices/`.

## A aresta falsa

O grafo reporta `libs/socket.ts -> app.ts`. **Não existe esse import.** A aresta
vem de `initIO()` referenciando `ALLOWED_ORIGINS`, que o extrator casou com
`allowedOrigins` de `app.ts` por normalização de nome. `socket.ts` não menciona
`allowedOrigins` em nenhuma linha.

Com ela, o grafo mostra núcleo de 134. Sem ela, 26. É exatamente a regra escrita
em `modules/knowledge_graph.md` do ENGINEERING OS: **uma aresta é hipótese até
ser confirmada**. Confirmar custou dois comandos e evitou perseguir um fantasma.

## O que sobra

Um componente de 26 arquivos e outro de 17, mais três minúsculos (3, 2, 2).
Nenhum tem violação de camada — são ciclos **dentro** da mesma camada
(serviço↔serviço), de natureza diferente e menor gravidade.

## Verificação

- `tsc --noEmit` limpo;
- gate: 62 suítes / 237 testes;
- deploy, `/version` 1.39, `/health/ready` 200;
- **sessão WhatsApp reconectada após restart**, com os ganchos registrados;
- grafo reconstruído e medido: 0 arestas reais subindo de camada.

## Limites honestos

- A **reconexão por queda de conexão** não foi exercitada: forçar queda de sessão
  do WhatsApp em produção com tráfego real não é aceitável. O caminho de boot
  (`StartAllWhatsAppsSessions`) foi provado; o de reconexão por timer depende do
  mesmo gancho registrado no mesmo lugar, e o registro é verificado no boot.
- `wbotMessageListener-dontwork.ts` foi atualizado junto por consistência de
  import; é arquivo morto que deveria ser removido em lote próprio.

## Rollback

Imagem anterior. Sem migration, sem mudança de esquema ou dado. Todas as
mudanças são de organização de import e movimentação de arquivo.
