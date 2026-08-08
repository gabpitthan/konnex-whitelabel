# Versão 1.38 — dois serviços deixaram de depender de um controller

Data: 2026-08-08
Estado: gate aprovado, implantada
Origem: primeira medição do grafo de dependências (`graphify`).

## O que o grafo mostrou

636 arquivos do backend, e **133 deles (21%) num único componente fortemente
conectado**: cada arquivo do núcleo alcança todos os outros e volta. Nenhum pode
ser entendido, testado ou substituído sozinho.

O achado útil não foi o tamanho, foi a causa: das **328 dependências internas**
do núcleo, apenas **9 sobem de camada** — e são elas que fecham o ciclo.
Simulando a remoção das nove, o núcleo cairia de 133 para **13 arquivos**.

As nove:

| Origem | Importa |
|---|---|
| `helpers/SendMessage.ts` | `services/WbotServices/SendWhatsAppMedia.ts` |
| `helpers/UpdateDeletedUserOpenTicketsStatus.ts` | `services/TicketServices/UpdateTicketService.ts` |
| `libs/queue.ts` | `jobs/index.ts` |
| `libs/socket.ts` | `app.ts` |
| `libs/wbot.ts` | `services/WbotServices/StartWhatsAppSession.ts` |
| `libs/wbot.ts` | `services/WbotServices/wbotMessageListener.ts` |
| `libs/wbot.ts` | `services/WhatsappService/ImportWhatsAppMessageService.ts` |
| `services/WebhookService/ActionsWebhookService.ts` | `controllers/MessageController.ts` |
| `services/WebhookService/DispatchWebHookService.ts` | `controllers/MessageController.ts` |

## O que este lote fez

Cortou as duas últimas: `sendMessageFlow` saiu de `controllers/MessageController.ts`
para `services/MessageServices/SendMessageFlowService.ts`, e os dois serviços de
webhook passaram a importar de lá.

A função nunca foi de controller — não lê `req.params`, não responde nada.
Recebia `req` apenas para alcançar `req.app.get("queues")`. A movimentação é
literal: mesmo corpo, mesma assinatura, nenhum comportamento alterado.

## O que este lote NÃO fez, e é importante dizer

**O núcleo não diminuiu.** Foi de 133 para 134 arquivos.

Isso não é falha da correção — é como ciclo funciona. Enquanto sobrar **uma**
aresta de retorno, o ciclo continua fechado; cortar duas de nove não abre nada.
O arquivo novo entrou no núcleo por herança (importa e é importado por membros
dele), não por defeito próprio.

A melhoria é de camada, não de acoplamento: serviço deixou de depender de
controller, o que estava errado independentemente do ciclo.

## Por que parou aqui

Das sete restantes, três são de natureza diferente e exigem decisão de
arquitetura, não movimentação de arquivo:

- `libs/wbot.ts` → `StartWhatsAppSession` e `ImportWhatsAppMessageService` são
  **chamadas de runtime reais** (reconexão de sessão e importação de histórico).
  Inverter exige registro de evento ou injeção de callback — muda o fluxo de
  controle da sessão do WhatsApp, que é a superfície mais crítica do produto.
- `libs/wbot.ts` → `wbotMessageListener` importa `getTypeMessage` e `isValidMsg`,
  funções puras de classificação presas num arquivo de 160 KB. Extraí-las é
  seguro, mas mexe num arquivo cuja pior função tem complexidade 39 (HEALTH-002).
- `libs/socket.ts` → `app.ts` não tem import direto no código; é aresta inferida
  pelo extrator e precisa ser confirmada antes de qualquer ação.

Fazer os sete de uma vez, num sistema em produção com tráfego real, contraria o
Art. 3 (lote pequeno) e não teria como ser verificado com honestidade.

## Evidência

`tsc --noEmit` limpo. Grafo reconstruído após a mudança: arestas que sobem de
camada caíram de **9 para 7**; núcleo em 134 arquivos, como esperado.

## Rollback

Imagem anterior. Movimentação de função, sem migration nem mudança de dados.
