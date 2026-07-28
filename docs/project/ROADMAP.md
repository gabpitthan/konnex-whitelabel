# Roadmap técnico

## P0 — confiabilidade

- Testes de autenticação e isolamento entre tenants.
- Endpoints de liveness/readiness para backend.
- Smoke autenticado sem exposição de credenciais.
- Backup e restauração testados antes de migrations destrutivas.
- Validar WhatsApp: pareamento, envio, recebimento, mídia e reconexão.

## P1 — engenharia

- CI com preflight, análise estática, testes e builds.
- Testes de FlowBuilder e rotas críticas.
- Logs estruturados com request ID e sanitização.
- Remover rotas duplicadas após teste de compatibilidade.
- Reduzir vulnerabilidades sem upgrades cegos.

## P2 — evolução

- Modernização progressiva do frontend legado.
- Redução do bundle e renderizações.
- Métricas operacionais e monitoramento externo.

As prioridades podem mudar conforme o pedido do usuário. Toda alteração deve ter critérios de aceite em `tasks/ACTIVE.md`.
