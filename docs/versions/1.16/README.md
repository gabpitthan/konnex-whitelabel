# Whitelabel Whaticket — versão 1.16

Data: 2026-07-29  
Estado: publicada

## Objetivo

Tornar o contexto inicial de ingestão WhatsApp — Contact e Ticket — protegido
por fence, idempotente sob concorrência e independente de Redis como fonte do
contador de não lidas.

## Fontes primárias

- PostgreSQL partial indexes:
  https://www.postgresql.org/docs/17/indexes-partial.html
- PostgreSQL constraints:
  https://www.postgresql.org/docs/current/ddl-constraints.html
- PostgreSQL INSERT/ON CONFLICT:
  https://www.postgresql.org/docs/current/sql-insert.html
- Sequelize findOrCreate:
  https://sequelize.org/api/v6/class/src/model.js~model

## Entregue

- Contact é localizado/criado por `companyId + number` dentro da transação
  fenced;
- Contact, contexto do Ticket e contador de não lidas usam a mesma transação da
  conexão;
- Ticket ativo possui índice único parcial por
  `companyId + contactId + whatsappId`;
- incremento de não lidas é atômico no PostgreSQL;
- Redis recebe somente um espelho pós-commit e sua falha não altera o valor
  confirmado;
- lookup remoto da foto ocorre antes do lock;
- sockets de Contact são registrados em `afterCommit`;
- os serviços legados de Ticket agora aceitam transação externa.

## Banco, backup e rollback

- backup: `/root/whitelabel-whaticket-backups/pre-1.16-20260729.dump`;
- SHA-256:
  `09c4f38bbcf16a4bde51944b3ac6ec37d2f6c54fcf3b8e53e1b97778951dc032`;
- restore real aprovado com 57 tabelas;
- migration aplicada/revertida/reaplicada na cópia;
- migration de produção: 77 ms;
- zero grupos duplicados e zero tickets WhatsApp ativos sem owner antes do DDL;
- índice final e zero duplicidades confirmados após deploy.

Rollback da aplicação: imagem 1.15. O índice é compatível e pode permanecer.
O `down` foi ensaiado, mas removê-lo em produção reabre a corrida e só deve ser
feito deliberadamente.

## Evidência

- preflight aprovado;
- 18 suítes e 62 testes aprovados;
- builds backend/frontend aprovados;
- API 1.16 e smoke aprovados antes/depois do restart;
- restart sem migration pendente;
- shutdown por SIGTERM concluiu em 1 ms.

## Autoavaliação 0–2

| Dimensão crítica | Nota | Evidência |
|---|---:|---|
| Corretude | 2 | invariant no banco e serviços transacionais |
| Persistência/integridade | 2 | backup/restore, migration e contador atômico |
| Auth/tenant | 2 | owner/fence/company/whatsapp validados |
| Regressão | 2 | 18 suítes/62 testes e builds |
| Falhas/resiliência | 2 | migration aborta; Redis deixa de ser autoridade |
| Performance | 1 | I/O fora do lock; espera p95/p99 ainda não medida |
| Runtime real | 1 | deploy/smoke/restart; conta canário ausente |
| Deploy/rollback | 2 | restore e down/up ensaiados |
| Memória | 2 | evidence pack e estado atualizados |

## Como ainda pode falhar?

- não houve sessão canário para provar duas instâncias disputando mensagens
  reais;
- caminhos não WhatsApp ainda usam o comportamento legado;
- falha após commit do Contact/Ticket e antes do commit da Message pode deixar
  contexto sem mensagem; o processamento idempotente deve retomá-la;
- download local da foto não faz parte do commit e depende dos eventos de
  atualização/enriquecimento;
- espera do row lock ainda não possui histograma;
- cluster continua bloqueado até todos os caminhos auxiliares estarem fenced.
