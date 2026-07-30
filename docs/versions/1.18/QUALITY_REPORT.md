# Relatório de qualidade — versão 1.18

Data: 2026-07-30  
Resultado: publicada

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| limite distribuído | Redis compartilhado por owner | integração Redis 7 |
| atomicidade | Lua `INCR+EXPIRE+TTL` | concorrência 1–20 sem perda |
| isolamento | chave tenant/conexão sem token | teste unitário e integração |
| proteção de recursos | middleware antes do Multer | revisão de ordem da rota |
| backpressure | 429/Retry-After; Redis 503 | testes negativos |

## Gates

- preflight: aprovado;
- testes: 22 suítes, 85 testes, zero falhas;
- integração Redis 7: 1 teste real, zero falhas;
- builds Docker backend/frontend: aprovados;
- schema: sem migration;
- runtime: API 1.18 e negativa 401;
- restart: desligamento limpo em 3 ms e API 1.18 recuperada.

## Limites

Não foi enviada mensagem real nem consumido o token de produção. A janela fixa
aceita burst na fronteira. Digest, rotação e revogação auditável permanecem no
próximo lote.
