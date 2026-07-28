# Matriz de testes

| Área | Build | Smoke | Persistência | Tenant A/B | Estado |
|---|---:|---:|---:|---:|---|
| Login | sim | manual | sim | não | parcial |
| FlowBuilder | sim | API manual | não | parcial | parcial |
| WhatsApp QR | sim | real | sim | não | parcial |
| WhatsApp mensagens | sim | não | não | não | pendente |
| Frontend geral | sim | HTTP | não | n/a | parcial |
| Endpoint de versão | sim | automático | n/a | n/a | aprovado |
| Socket.IO autenticado | sim | falha de contrato confirmada | não | não | crítico |
| Sala de ticket Socket.IO | sim | não | não | não | crítico |
| Auth state Redis | sim | QR apenas | parcial | não | crítico |
| Reconexão WhatsApp | sim | não | não | não | pendente |
| Jobs Bull/idempotência | sim | não | não | não | pendente |
| Mídia WhatsApp | sim | não | não | não | pendente |

Cada tarefa deve atualizar as linhas afetadas e registrar evidência no README da subversão.
