# Relatório de qualidade — versão 1.22

Data: 2026-07-31
Resultado: publicada

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| baixo overhead | top, planning/utility off, max 5000 | lab + runtime |
| sigilo | relatório sem coluna `query` | verificação estática/JSON |
| reversibilidade | extension migration + Compose | lab e restore up/down/up |
| recuperação | backup custom 0600 | SHA-256 registrado |
| decisão por dados | snapshot de custo/I/O/locks | relatório produção |
| tempo correto | Pino ISO UTC | teste e log runtime |

## Gates

- preflight: aprovado;
- testes: 34 suítes/115 testes;
- timestamp: 1 teste focado adicional;
- builds Docker backend/frontend: aprovados;
- laboratório PostgreSQL 16: create/coleta/drop;
- restore: migration `up → down → up`, 63–118 ms;
- produção: migration 113 ms e módulo carregado;
- API 1.22/frontend: saudáveis; restart/shutdown em 2 ms.

## Snapshot inicial

- conexões: 2/100;
- ativas fora do relatório: 0;
- cache hit: 99,9936%;
- lock waiters/idle transaction/deadlocks/temp bytes: 0;
- deallocations do módulo: 0;
- pior `max_exec_time` entre top 20: 14,322 ms.

## Conclusão

Não há evidência inicial para índice, mais cache ou expansão de pool. A decisão
correta é acumular janela representativa e observar query IDs recorrentes,
WAL, leituras e p95/p99 operacionais antes de mudar o plano de execução.
