# Whitelabel Whaticket — versão 1.15

Data: 2026-07-29  
Estado: publicada

## Objetivo

Mover a validação do fencing token para dentro do commit que persiste a mensagem
WhatsApp e atualiza seu ticket.

## Mudança

- a transação bloqueia a linha `Whatsapps` exata por
  `id + companyId + sessionFence`;
- a mesma transação bloqueia o Ticket por `id + companyId + whatsappId`;
- `Ticket.lastMessage`, eventual reabertura e Message formam um único commit;
- a emissão Socket.IO da Message é registrada em `afterCommit`;
- I/O do WhatsApp, download de mídia, filesystem e ffmpeg permanecem fora do
  lock;
- o mutex local por mensagem, que não sincronizava chamadas distintas, foi
  removido.

## Banco e rollback

Não há migration. Rollback operacional: reconstruir e publicar a imagem 1.14.
O schema da 1.13 continua compatível.

## Evidência

- constraints e duplicidades de Contact/Ticket foram auditadas sem ler conteúdo
  de mensagens;
- build TypeScript em Docker aprovado;
- gate completo: 14 suítes e 53 testes aprovados;
- builds Docker backend/frontend aprovados;
- API respondeu `1.15` e smoke passou antes/depois do restart;
- nenhuma migration pendente;
- shutdown por `SIGTERM` fechou recursos em 3 ms;
- owner/fence ausente ou incorreto falha antes das mutações de domínio.

## Autoavaliação 0–2

| Dimensão crítica | Nota | Evidência |
|---|---:|---|
| Entendimento/corretude | 2 | requisito mapeado para lock e commit |
| Persistência/integridade | 2 | Ticket+Message na mesma transação |
| Auth/tenant | 2 | owner, tenant, WhatsApp, ticket e fence validados |
| Regressão | 2 | 14 suítes/53 testes e builds |
| Falhas/resiliência | 2 | stale fence e ticket estrangeiro negados |
| Performance | 1 | I/O fora do lock; p95/p99 ainda ausente |
| Runtime real | 1 | deploy/smoke/restart; WhatsApp canário ausente |
| Deploy/rollback | 2 | imagem publicada; rollback 1.14 sem schema |
| Memória | 2 | evidence pack e estado persistente atualizados |

Fatos: testes, builds, versão, smoke, restart e ausência de migration foram
observados. Inferência sustentada pela semântica oficial do PostgreSQL: takeover
concorrente espera o row lock. Não testado: disputa entre dois processos com
uma sessão WhatsApp real.

## Como esta entrega ainda pode falhar?

- criação/atualização de Contact e criação inicial de Ticket ainda antecedem a
  transação fenced;
- mensagens geradas por caminhos auxiliares que não recebem a sessão seguem
  usando a transação Message existente, sem o fence da sessão;
- contenção da linha Whatsapp ainda não possui métrica p95/p99;
- teste canário com duas instâncias e sessão real continua pendente;
- o modo cluster permanece bloqueado.

## Fontes

- PostgreSQL: https://www.postgresql.org/docs/17/explicit-locking.html
- Sequelize transactions:
  https://sequelize.org/docs/v6/other-topics/transactions/
- Redis distributed locks:
  https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/
