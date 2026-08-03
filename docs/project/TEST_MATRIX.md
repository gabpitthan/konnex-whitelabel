# Matriz de testes

| Área | Build | Smoke | Persistência | Tenant A/B | Estado |
|---|---:|---:|---:|---:|---|
| Login | sim | manual | sim | não | parcial |
| FlowBuilder | sim | API manual | não | parcial | parcial |
| WhatsApp QR | sim | real | sim | não | parcial |
| WhatsApp mensagens | sim | não | não | não | pendente |
| Frontend geral | sim | HTTP | não | n/a | parcial |
| Endpoint de versão | sim | automático | n/a | n/a | aprovado |
| Socket.IO autenticado | sim | runtime publicado | sessão | namespace A/B | aprovado |
| Sala de ticket Socket.IO | sim | serviço automatizado | n/a | ticket+empresa | aprovado com limite |
| Auth state Redis | sim | unitário + Redis 7 | v2/legacy fenced | chave tenant-aware | parcial |
| Lifecycle WhatsApp | sim | concorrência + TTL/ABA | fence PostgreSQL | owner tenant-aware | parcial |
| Shutdown do backend | sim | estado unitário | auth preservado por desenho | owner tenant-aware | parcial, runtime pendente |
| Purge Redis | sim | SCAN/UNLINK unitário | n/a | pattern do chamador | aprovado |
| Reconexão WhatsApp | sim | política limitada | não | não | pendente canário |
| Jobs Bull/idempotência | sim | DLQ+shutdown runtime | retenção Redis | companyId handlers ACK/message | parcial, outbox pendente |
| Bull Board legado | sim | rota 404+pacotes ausentes | n/a | n/a | removido na 1.30, 2 contratos |
| Agendamento/claim | sim | PG16 concorrente+produção | UUID/CAS + reconciliação | companyId NOT NULL+CAS | parcial, canário pendente |
| Campanha/dispatch | sim | PG16 CAS+confirmação | UUID/fase + reconciliação | owner/FK/CAS companyId | parcial, gate/canário pendente |
| Mídia WhatsApp | sim | não | não | não | pendente |
| Liveness/readiness | sim | runtime | n/a | n/a | aprovado |
| Pool PostgreSQL | sim | runtime | n/a | n/a | aprovado, 6→1 idle |
| Observabilidade PostgreSQL | sim | laboratório+produção | pg_stat_statements save | sem texto SQL/PII | coleta inicial aprovada |
| Range/contagem mensagens | sim | unitário | n/a | companyId | parcial, token global |
| Idempotência Message | sim | migration+unitário | unique+transação | companyId+wid | aprovado |
| Lookup Message por wid | sim | unitário+runtime | n/a | companyId obrigatório | aprovado |
| Commit fenced Message/Ticket | sim | unitário+runtime | mesma transaction | owner+fence+tenant | parcial, canário pendente |
| Contexto Contact/Ticket | sim | migration+unitário+runtime | unique+increment | owner+fence+tenant | parcial, canário pendente |
| API externa | sim | 401+legado+Redis 7 | uso unique+rate TTL | contexto pelo Bearer | aprovado, canário de envio pendente |
| Ciclo de token API | sim | 28 focados+relatório runtime | digest+telemetria dual | rotate/revoke/status tenant/admin | parcial, rotação/30 dias pendentes |
| Composição de rotas | sim | runtime 404/403 | n/a | mounts canônicos | aprovado, 2 contratos |
| Cliente HTTP externo | sim | runtime de configuração | n/a | sem contexto de tenant | parcial, 6 contratos; provedores reais pendentes |
| Egress SSRF/DNS rebinding | sim | público+metadata em produção | n/a | sem URL/IP/tenant em log | aprovado, contas reais pendentes |

Cada tarefa deve atualizar as linhas afetadas e registrar evidência no README da subversão.
