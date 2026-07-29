# Problemas conhecidos

| ID | Severidade | Estado | Problema |
|---|---|---|---|
| ENG-001 | Alto | parcial | Há 34 testes P0 focados e um teste Redis 7; a cobertura integral do CRM continua pendente. |
| SEC-001 | Crítico | aberto | Isolamento multiempresa ainda não foi auditado/testado integralmente. |
| WA-001 | Alto | parcial | QR funciona; envio, recebimento, mídia e reconexão aguardam teste real. |
| FE-001 | Alto | aberto | Frontend possui 105 vulnerabilidades npm reportadas no build. |
| BE-001 | Alto | aberto | Backend reporta 77 vulnerabilidades npm (8 críticas) e dependências legadas; atualização exige lotes controlados. |
| OPS-001 | Alto | mitigado | Backend/frontend possuem healthchecks; faltam monitor externo, SLO e alerta. |
| OBS-001 | Médio | aberto | Logs sem correlação completa e observabilidade incompleta. |
| FE-002 | Médio | aberto | Bundle principal grande e muitos avisos legados de lint. |
| API-001 | Médio | investigar | Há indícios de montagem duplicada de rotas de mensagens/webhooks. |
| WA-002 | Crítico | parcial | Auth state e lifecycle possuem lease/fencing; falta propagar o fence às transações de domínio e completar o registry de disposers. |
| JOB-001 | Alto | confirmado | Jobs Bull não têm política uniforme de idempotência, stalled/dead-letter e telemetria. |
| DB-001 | Alto | confirmado | Existem queries interpoladas e fluxos críticos sem garantia explícita de transação/afterCommit. |
| WA-003 | Alto | planejado | Baileys 6.x está sem suporte; v7 exige laboratório por breaking changes de LID, ESM, auth e protobuf. |
| RT-001 | Médio | aberto | Mais de cem emissores usam namespaces numéricos e dependem temporariamente da normalização central para `/workspace-N`. |
| TEST-001 | Médio | aberto | QA Socket.IO runtime ainda é temporário; falta incorporá-lo como E2E permanente com dois tenants isolados. |
| WA-004 | Alto | mitigado | `server-cluster.ts` falha explicitamente; escala horizontal aguarda CAS transacional nas mutações de domínio. |
| REDIS-001 | Alto | parcial | Auth state v2 possui envelope/checksum e purge sem `KEYS`; batches, manifesto e restore ensaiado continuam pendentes. |
| ENG-002 | Médio | aberto | Lint global voltou a executar e expõe 2.975 problemas legados; arquivos novos da 1.10 passam isoladamente. |
| OPS-002 | Médio | parcial | Shutdown fecha WhatsApp e Socket.IO; Bull, Sequelize e clientes Redis ainda não têm encerramento explícito central. |
| API-002 | Crítico | próximo | O token global de endpoints `/api` não vincula identidade ao tenant; `companyId` ainda é informado pelo cliente. |
| DB-002 | Alto | parcial | Pool único e orçamento seguro entregues; faltam `pg_stat_statements`, timeouts por workload e métricas de espera. |
| REDIS-002 | Alto | aberto | Auth/lease, cache e filas compartilham Redis; separar papéis antes de eviction ou escala horizontal. |
| MSG-001 | Alto | parcial | Contact/Ticket e Message usam commits fenced separados; caminhos auxiliares e atomicidade integral da ingestão ainda requerem canário/outbox. |
| OPS-003 | Alto | mitigado | Rollout 1.13 reiniciou por drop de constraint dependente; schema ficou intacto e a regra foi incorporada. |

Problemas corrigidos pertencem ao changelog e aos READMEs de versão, não devem continuar descritos como falhas atuais.
