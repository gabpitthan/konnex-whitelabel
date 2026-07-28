# Relatório de qualidade — 1.6

Data: 2026-07-28

| Gate | Resultado |
|---|---|
| Preflight | aprovado |
| Versões sincronizadas | 1.6 |
| Backend TypeScript | aprovado |
| Frontend produção | aprovado com avisos legados |
| Deploy | aprovado |
| Smoke | aprovado |
| API `/version` | 1.6 |
| Migration | nenhuma |

## Regressões tratadas

- `overflowY: hidden` removido do conteúdo central.
- Uma região previsível de scroll por contexto.
- Diálogos em flex com conteúdo rolável.
- Título e ações fora da região de scroll.
- Ações mobile acessíveis com faixa horizontal quando necessário.
- `100dvh` e safe areas do iPhone.

## Compatibilidade preservada

- rotas;
- APIs;
- autenticação;
- permissões;
- flags de plano;
- sockets;
- notificações;
- perfil;
- filtros e exportação do Dashboard.
