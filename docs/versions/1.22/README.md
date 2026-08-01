# Whitelabel Whaticket — versão 1.22

Data: 2026-07-31
Estado: publicada

## Objetivo

Coletar evidência real de custo, I/O e contenção PostgreSQL antes de criar
índices, alterar cache ou ajustar pools.

## Fontes primárias

- PostgreSQL 16, `pg_stat_statements`:
  https://www.postgresql.org/docs/16/pgstatstatements.html
- PostgreSQL 16, cumulative statistics:
  https://www.postgresql.org/docs/16/monitoring-stats.html
- PostgreSQL 16, viewing locks:
  https://www.postgresql.org/docs/16/monitoring-locks.html
- PostgreSQL 16, `pg_locks`:
  https://www.postgresql.org/docs/16/view-pg-locks.html
- PostgreSQL 16, resource consumption:
  https://www.postgresql.org/docs/16/runtime-config-resource.html

## Baseline real

- PostgreSQL 16 oferece a extensão, mas ela não estava instalada/carregada;
- `max_connections=100`, duas conexões no primeiro snapshot;
- `shared_buffers=128MB`, `work_mem=4MB`, `effective_cache_size=4GB`;
- host com 8,32 GB totais e 4,49 GB disponíveis;
- 15.100.106 buffer hits contra 770 reads;
- zero temp files, zero deadlocks, zero lock waiters e zero idle transaction;
- container PostgreSQL sem limite Docker próprio e sem restart desde 28/07.

## Configuração escolhida

- `shared_preload_libraries=pg_stat_statements`;
- `compute_query_id=on`;
- `max=5000` (default conservador);
- `track=top`;
- `track_planning=off`, evitando contenção/overhead documentado;
- `track_utility=off`, reduzindo coleta desnecessária e risco de texto sensível;
- `save=on`, preservando baseline entre restarts.

## Relatório seguro

`scripts/postgres-observability-report.sh` é operacional/local, não HTTP. Ele
retorna somente métricas agregadas e `queryid`: nunca seleciona texto SQL,
parâmetros, tenant ou conteúdo de mensagem. Inclui conexões, locks, cache hit,
temp bytes, deadlocks, WAL e top 20 por tempo total.

## Evidência pré-produção

- laboratório efêmero PostgreSQL 16: create/coleta/drop aprovados;
- parâmetros observados: `top|off|off|5000`;
- migration unitária: 2 testes;
- shell syntax e ausência de seleção de query text aprovadas.

## Rollback

1. executar down da migration para `DROP EXTENSION`;
2. reverter o `command` do PostgreSQL no Compose;
3. recriar somente PostgreSQL e backend;
4. confirmar readiness e ausência de migration pendente.

A extensão precisa de restart para entrar/sair do preload. O volume de dados
não é recriado e haverá backup/restore antes do rollout.

## Evidência de publicação

- backup: `pre-1.22-20260731.dump`, modo `0600`;
- SHA-256:
  `0c0d34c57608e45cb40c453933524c2c09918603e3a7966df27a6b390b9829f0`;
- restore: `up → down → up`, 63–118 ms;
- gate: 34 suítes/115 testes e builds backend/frontend;
- logger: teste ISO UTC adicional aprovado;
- produção: extension migration em 113 ms;
- parâmetros runtime: `top|planning off|utility off|5000`;
- snapshot: 2/100 conexões, cache hit 99,9936%, zero lock waiters,
  idle transaction, deadlocks e temp bytes, pior máximo 14,322 ms;
- API 1.22, frontend 200 e restart/shutdown em 2 ms;
- conclusão: ainda não existe evidência para novo índice ou cache.

## Correção de timestamp

O logger gravava uma string `DD-MM-YYYY` no campo `time` e o `pino-pretty`
tentava traduzi-la novamente, invertendo mês/dia. Agora Pino produz ISO-8601
UTC e o transport usa formato UTC explícito, melhorando correlação e evitando
formatação pesada com Moment no processo.
