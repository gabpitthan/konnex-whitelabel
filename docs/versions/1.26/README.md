# Whitelabel Whaticket — versão 1.26

Data: 2026-08-03
Estado: publicada

## Objetivo

Criar uma fundação segura para filas Bull: falhas devem chegar a retry/DLQ,
eventos não podem expor payloads, retenção deve ser limitada e todas as
conexões precisam fechar no shutdown.

## Pesquisa primária

- Bull 3 documenta semântica at-least-once e possível duplicação após stall;
- a Promise do processor deve rejeitar para o job falhar;
- `removeOnComplete`/`removeOnFail` limitam crescimento do Redis;
- `close()` é a API oficial de graceful shutdown;
- Redis AOF everysec pode perder aproximadamente um segundo em desastre;
- `noeviction` preserva chaves existentes e rejeita novas escritas ao saturar.

Fontes:

- https://github.com/OptimalBits/bull
- https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md
- https://github.com/OptimalBits/bull/blob/develop/PATTERNS.md
- https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- https://redis.io/docs/latest/develop/reference/eviction/

## Baseline

- Bull resolvido em 3.29.3;
- seis filas principais: zero waiting/active/failed/completed e quatro repeat
  jobs delayed;
- Redis: 2,31 MiB, AOF yes/everysec, noeviction, sem maxmemory configurado;
- handlers de mensagem e ACK engoliam erro e confirmavam falso sucesso;
- logger de falha interpolava `job.data`;
- shutdown não fechava nenhuma instância Bull.

## Mudança

- handlers validam contrato e propagam exceções ao Bull;
- eventos failed/stalled/error são estruturados e omitem payload, ID e mensagem;
- completed retém até 1 h/100 e failed até 7 dias/500 por fila;
- todas as filas compartilham a política sem adicionar retry a efeitos não
  idempotentes;
- shutdown fecha instâncias únicas e falha explicitamente se algum close falhar.

## Evidência

- gate completo: 40 suítes/168 testes e builds backend/frontend aprovados;
- após a correção runtime, 4 suítes/14 testes focados e build backend passaram;
- API 1.26, frontend e smoke aprovados;
- job diagnóstico terminou `failed`, emitiu somente metadados seguros e foi
  removido imediatamente;
- o rollout revelou que ACK desabilitado ainda criava conexões inválidas; a
  correção final passou em runtime sem novos `bull_queue_error`;
- restart fechou seis filas em 538 ms, zero falhas, e abriu zero filas ACK.

## Compatibilidade e rollback

Não há migration. Jobs já enfileirados preservam suas opções; novos jobs passam
a ter retenção limitada. Rollback: imagem 1.25.

## Como esta entrega ainda pode falhar?

- efeitos externos continuam at-least-once até idempotência/outbox por fluxo;
- AOF everysec não equivale a zero perda;
- Redis de fila ainda compartilha processo com auth/lease/cache;
- jobs CPU-bound podem perder lock e precisam isolamento/medição específicos;
- canais reais WhatsApp/campanha/agendamento ainda não foram exercitados.
