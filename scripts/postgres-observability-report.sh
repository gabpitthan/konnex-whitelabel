#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

docker compose exec -T postgres sh -c \
  'psql -X -A -t -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
WITH database_stats AS (
  SELECT
    numbackends AS connections,
    xact_commit,
    xact_rollback,
    deadlocks,
    temp_bytes,
    ROUND(
      100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0),
      4
    ) AS cache_hit_ratio
  FROM pg_stat_database
  WHERE datname = current_database()
),
activity AS (
  SELECT
    COUNT(*) FILTER (
      WHERE state = 'active' AND pid <> pg_backend_pid()
    ) AS active,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction,
    COUNT(*) FILTER (WHERE wait_event_type = 'Lock') AS lock_waiters
  FROM pg_stat_activity
  WHERE datname = current_database()
),
top_statements AS (
  SELECT
    queryid::text AS query_id,
    calls,
    ROUND(total_exec_time::numeric, 3) AS total_ms,
    ROUND(mean_exec_time::numeric, 3) AS mean_ms,
    ROUND(max_exec_time::numeric, 3) AS max_ms,
    rows,
    shared_blks_hit,
    shared_blks_read,
    temp_blks_written,
    wal_bytes::text AS wal_bytes
  FROM pg_stat_statements
  WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
    AND queryid IS NOT NULL
  ORDER BY total_exec_time DESC
  LIMIT 20
),
statement_summary AS (
  SELECT
    COUNT(*) AS tracked,
    COALESCE(jsonb_agg(to_jsonb(top_statements)), '[]'::jsonb) AS top
  FROM top_statements
)
SELECT jsonb_build_object(
  'capturedAt', NOW(),
  'moduleLoaded',
    POSITION('pg_stat_statements' IN current_setting('shared_preload_libraries')) > 0,
  'track', current_setting('pg_stat_statements.track'),
  'trackPlanning', current_setting('pg_stat_statements.track_planning')::boolean,
  'trackUtility', current_setting('pg_stat_statements.track_utility')::boolean,
  'maxStatements', current_setting('pg_stat_statements.max')::integer,
  'statsReset', info.stats_reset,
  'deallocations', info.dealloc,
  'connections', db.connections,
  'maxConnections', current_setting('max_connections')::integer,
  'activeConnections', activity.active,
  'idleInTransaction', activity.idle_in_transaction,
  'lockWaiters', activity.lock_waiters,
  'commits', db.xact_commit,
  'rollbacks', db.xact_rollback,
  'deadlocks', db.deadlocks,
  'tempBytes', db.temp_bytes,
  'cacheHitRatio', db.cache_hit_ratio,
  'trackedTopStatements', summary.tracked,
  'topStatements', summary.top
)
FROM database_stats db
CROSS JOIN activity
CROSS JOIN pg_stat_statements_info info
CROSS JOIN statement_summary summary;
SQL
