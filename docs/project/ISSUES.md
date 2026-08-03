# Problemas conhecidos

| ID | Severidade | Estado | Problema |
|---|---|---|---|
| ENG-001 | Alto | parcial | Há 46 suítes/178 testes no gate versionado e integrações Redis 7; a cobertura integral do CRM continua pendente. |
| SEC-001 | Crítico | aberto | Isolamento multiempresa ainda não foi auditado/testado integralmente. |
| WA-001 | Alto | parcial | QR funciona; envio, recebimento, mídia e reconexão aguardam teste real. |
| FE-001 | Alto | aberto | Frontend possui 105 vulnerabilidades npm reportadas no build. |
| BE-001 | Alto | parcial | Axios corrigido na 1.24; backend runtime ainda reporta 75 vulnerabilidades npm (8 críticas) em famílias legadas. |
| OPS-001 | Alto | mitigado | Backend/frontend possuem healthchecks; faltam monitor externo, SLO e alerta. |
| OBS-001 | Médio | parcial | Timestamp ISO UTC e métricas PostgreSQL chegaram na 1.22; faltam request ID, SLO e alerta externo. |
| FE-002 | Médio | aberto | Bundle principal grande e muitos avisos legados de lint. |
| WA-002 | Crítico | parcial | Auth state e lifecycle possuem lease/fencing; falta propagar o fence às transações de domínio e completar o registry de disposers. |
| JOB-001 | Alto | parcial | Retenção/telemetria/shutdown e claim de Schedule chegaram; campanha e mensagem avulsa ainda precisam idempotência por efeito externo. |
| DB-001 | Alto | confirmado | Existem queries interpoladas e fluxos críticos sem garantia explícita de transação/afterCommit. |
| WA-003 | Alto | planejado | Baileys 6.x está sem suporte; v7 exige laboratório por breaking changes de LID, ESM, auth e protobuf. |
| RT-001 | Médio | aberto | Mais de cem emissores usam namespaces numéricos e dependem temporariamente da normalização central para `/workspace-N`. |
| TEST-001 | Médio | aberto | QA Socket.IO runtime ainda é temporário; falta incorporá-lo como E2E permanente com dois tenants isolados. |
| WA-004 | Alto | mitigado | `server-cluster.ts` falha explicitamente; escala horizontal aguarda CAS transacional nas mutações de domínio. |
| REDIS-001 | Alto | parcial | Auth state v2 possui envelope/checksum e purge sem `KEYS`; batches, manifesto e restore ensaiado continuam pendentes. |
| ENG-002 | Médio | aberto | Lint global voltou a executar e expõe 2.975 problemas legados; arquivos novos da 1.10 passam isoladamente. |
| OPS-002 | Médio | parcial | Shutdown fecha WhatsApp, Socket.IO e Bull; Sequelize e os demais clientes Redis ainda não têm encerramento explícito central. |
| API-003 | Alto | parcial | Telemetria segura chegou na 1.21 e detecta um legado ativo; falta rotação coordenada, observar 30 dias e remover plaintext. |
| DB-002 | Alto | parcial | Pool e `pg_stat_statements` entregues; faltam janela representativa, timeouts por workload e alerta de espera. |
| REDIS-002 | Alto | aberto | Auth/lease, cache e filas compartilham Redis; separar papéis antes de eviction ou escala horizontal. |
| MSG-001 | Alto | parcial | Contact/Ticket e Message usam commits fenced separados; caminhos auxiliares e atomicidade integral da ingestão ainda requerem canário/outbox. |
| SCHED-001 | Alto | parcial | Claim/CAS evita concorrência; crash após PROCESSANDO permanece ambíguo e exige reconciliação manual, sem reenvio automático. |
| OPS-003 | Alto | mitigado | Rollout 1.13 reiniciou por drop de constraint dependente; schema ficou intacto e a regra foi incorporada. |

Problemas corrigidos pertencem ao changelog e aos READMEs de versão, não devem continuar descritos como falhas atuais.
