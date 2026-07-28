# Problemas conhecidos

| ID | Severidade | Estado | Problema |
|---|---|---|---|
| ENG-001 | Crítico | aberto | Não há suíte automatizada relevante. |
| SEC-001 | Crítico | aberto | Isolamento multiempresa ainda não foi auditado/testado integralmente. |
| WA-001 | Alto | parcial | QR funciona; envio, recebimento, mídia e reconexão aguardam teste real. |
| FE-001 | Alto | aberto | Frontend possui 105 vulnerabilidades npm reportadas no build. |
| BE-001 | Alto | aberto | Backend possui dependências legadas e vulnerabilidades conhecidas. |
| OPS-001 | Alto | aberto | Backend/frontend ainda não possuem healthchecks próprios. |
| OBS-001 | Médio | aberto | Logs sem correlação completa e observabilidade incompleta. |
| FE-002 | Médio | aberto | Bundle principal grande e muitos avisos legados de lint. |
| API-001 | Médio | investigar | Há indícios de montagem duplicada de rotas de mensagens/webhooks. |
| WA-002 | Crítico | parcial | Auth state agora falha fechado e lifecycle tem single-flight/generation local; faltam lease distribuído, cleanup central e shutdown. |
| JOB-001 | Alto | confirmado | Jobs Bull não têm política uniforme de idempotência, stalled/dead-letter e telemetria. |
| DB-001 | Alto | confirmado | Existem queries interpoladas e fluxos críticos sem garantia explícita de transação/afterCommit. |
| WA-003 | Alto | planejado | Baileys 6.x está sem suporte; v7 exige laboratório por breaking changes de LID, ESM, auth e protobuf. |
| RT-001 | Médio | aberto | Mais de cem emissores usam namespaces numéricos e dependem temporariamente da normalização central para `/workspace-N`. |
| TEST-001 | Médio | aberto | QA Socket.IO runtime ainda é temporário; falta incorporá-lo como E2E permanente com dois tenants isolados. |
| WA-004 | Alto | aberto | `server-cluster.ts` iniciaria uma sessão Baileys por worker; Docker atual usa `server.ts`, mas modo cluster deve ser bloqueado ou usar lease distribuído. |
| REDIS-001 | Alto | parcial | Auth state v2 possui envelope/checksum; batches, manifesto, purge sem `KEYS` e restore ensaiado continuam pendentes. |

Problemas corrigidos pertencem ao changelog e aos READMEs de versão, não devem continuar descritos como falhas atuais.
