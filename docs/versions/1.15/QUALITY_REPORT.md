# Relatório de qualidade — versão 1.15

Data: 2026-07-29  
Resultado: aprovado dentro do escopo, cluster ainda bloqueado

## Requisito → mudança → evidência

| Requisito | Mudança | Evidência |
|---|---|---|
| negar owner obsoleto | lookup fenced + `FOR UPDATE` | testes fence atual/obsoleto |
| impedir cross-tenant | owner e Ticket incluem `companyId` | teste ticket estrangeiro |
| commit indivisível | Ticket e Message usam a mesma transaction | teste de propagação |
| não emitir antes do commit | `transaction.afterCommit` | teste positivo e rollback |
| preservar throughput | rede/mídia/ffmpeg fora do lock | revisão estática do fluxo |

## Gates

- preflight: aprovado;
- TypeScript/backend: aprovado;
- testes: 14 suítes, 53 testes, zero falhas;
- build backend/frontend: aprovado;
- deploy Compose: aprovado;
- versão runtime: 1.15;
- smoke antes/depois do restart: aprovado;
- shutdown: recursos fechados em 3 ms;
- migration: nenhuma pendente.

## Riscos residuais

- Contact e criação inicial de Ticket ainda não estão na transação fenced;
- não há histograma de espera do row lock;
- sessão canário e teste de dois processos continuam pendentes;
- alertas npm permanecem no baseline: backend 77/8 críticos; frontend 105/4
  críticos;
- bundle frontend principal permanece em 1,68 MB comprimido.

## Rollback

Republicar a imagem construída do commit 1.14. Não há migration nem alteração
de schema a desfazer.
