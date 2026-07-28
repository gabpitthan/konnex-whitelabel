# Relatório de qualidade — 1.4

Data: 2026-07-28

## Resultado

| Gate | Resultado |
|---|---|
| Versões sincronizadas | aprovado |
| README da subversão | aprovado |
| Compose válido | aprovado |
| Arquivos sensíveis rastreados | nenhum encontrado |
| Shell dos scripts | aprovado |
| Backend TypeScript | aprovado |
| Frontend produção | aprovado com avisos |
| Deploy | aprovado |
| Smoke frontend/API | aprovado |
| API `/version` | `1.4` |

## Dívida observada

- Backend runtime: 77 vulnerabilidades npm reportadas, sendo 8 críticas.
- Frontend: 105 vulnerabilidades npm reportadas, sendo 4 críticas.
- Frontend compila com muitos avisos legados de lint e bundle principal de aproximadamente 1,67 MB gzip.
- Não existem testes automatizados relevantes para afirmar cobertura funcional.

Nenhuma atualização forçada de dependências foi aplicada neste lote, pois isso exige testes de regressão próprios.
