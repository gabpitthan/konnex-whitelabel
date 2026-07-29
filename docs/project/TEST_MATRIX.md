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
| Jobs Bull/idempotência | sim | não | não | não | pendente |
| Mídia WhatsApp | sim | não | não | não | pendente |
| Liveness/readiness | sim | runtime | n/a | n/a | aprovado |
| Pool PostgreSQL | sim | runtime | n/a | n/a | aprovado, 6→1 idle |
| Range/contagem mensagens | sim | unitário | n/a | companyId | parcial, token global |

Cada tarefa deve atualizar as linhas afetadas e registrar evidência no README da subversão.
