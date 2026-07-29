# Roadmap técnico

## P0 — confiabilidade

- Corrigir autenticação, contrato de IDs e isolamento do Socket.IO.
- Implementar máquina de estados e single-flight das sessões WhatsApp.
- Tornar falhas do auth state Redis explícitas e seguras.
- Testes de autenticação e isolamento entre tenants.
- Endpoints de liveness/readiness para backend.
- Smoke autenticado sem exposição de credenciais.
- Backup e restauração testados antes de migrations destrutivas.
- Validar WhatsApp: pareamento, envio, recebimento, mídia e reconexão.
- Propagar fencing WhatsApp para dentro das transações de domínio.
- Vincular tokens de API a um tenant, sem `companyId` confiado do cliente.
- Ensaiar backup e restauração de PostgreSQL e auth state Redis.

## P1 — engenharia

- Idempotência e telemetria dos jobs Bull.
- Transações para ticket/mensagem e emissão afterCommit.
- Remover SQL interpolado.
- CI com preflight, análise estática, testes e builds.
- Testes de FlowBuilder e rotas críticas.
- Logs estruturados com request ID e sanitização.
- Remover rotas duplicadas após teste de compatibilidade.
- Reduzir vulnerabilidades sem upgrades cegos.
- Medir queries reais com `pg_stat_statements` antes de criar índices.
- Impor orçamento total de pools por número de réplicas/processos.
- Separar Redis de estado/lease do Redis de cache/filas.
- Medir event-loop, pool, locks, filas e latências p95/p99.

## P2 — evolução

- Laboratório/canário Baileys 7 com LID, novo auth state e rollback.
- Modernização progressiva do frontend legado.
- Redução do bundle e renderizações.
- Métricas operacionais e monitoramento externo.

As prioridades podem mudar conforme o pedido do usuário. Toda alteração deve ter critérios de aceite em `tasks/ACTIVE.md`.
