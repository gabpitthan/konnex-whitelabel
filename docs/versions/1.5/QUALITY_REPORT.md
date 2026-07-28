# Relatório de qualidade — 1.5

Data: 2026-07-28

| Verificação | Resultado |
|---|---|
| Versões frontend/backend | 1.5 |
| Preflight | aprovado |
| Backend TypeScript | aprovado |
| Frontend produção | aprovado com avisos legados |
| Deploy Docker | aprovado |
| Smoke local | aprovado |
| API pública `/version` | 1.5 |
| Login desktop 1440×900 | inspecionado |
| Login mobile 390×844 | inspecionado |
| Rotas/APIs alteradas | nenhuma |
| Migration | nenhuma |

## Observações

- O primeiro smoke coincidiu com a inicialização do backend e recebeu reset de conexão.
- O script passou a aguardar até 30 segundos pela API, evitando falso negativo durante migrations/startup.
- Bundle principal permanece em aproximadamente 1,68 MB gzip.
- Avisos e vulnerabilidades legadas continuam registrados em `docs/project/ISSUES.md`.
