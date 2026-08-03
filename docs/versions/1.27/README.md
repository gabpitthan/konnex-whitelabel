# Whitelabel Whaticket — versão 1.27

Data: 2026-08-03
Estado: publicada

## Objetivo

Dar ao PostgreSQL a autoridade sobre cada ocorrência agendada, impedindo claim
e execução concorrentes e removendo conteúdo de cliente dos jobs Redis.

## Pesquisa primária

- Bull entrega at-least-once e pode executar job stalled novamente;
- outbox garante publicação após commit, mas o relay pode publicar duas vezes;
- PostgreSQL indica `SKIP LOCKED` para consumidores de tabela tipo fila;
- `UPDATE ... RETURNING` prova exatamente quais linhas foram reclamadas;
- Baileys aceita messageId, mas não documenta dedupe de envio pelo WhatsApp.

Fontes:

- https://github.com/OptimalBits/bull
- https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md
- https://microservices.io/patterns/data/transactional-outbox.html
- https://microservices.io/patterns/communication-style/idempotent-consumer.html
- https://www.postgresql.org/docs/16/sql-select.html
- https://www.postgresql.org/docs/16/sql-update.html
- https://www.postgresql.org/docs/16/explicit-locking.html
- https://github.com/WhiskeySockets/Baileys
- https://baileys.wiki/docs/socket/handling-messages/

## Baseline

- Schedules: zero linhas, 24 KiB, somente PK e índice companyId;
- scanner concorrente e não aguardado, sem recuperação de overdue/órfão;
- snapshot completo de Schedule persistido no Redis;
- consumer sem compare-and-set de tenant/chave/status;
- envio e status PostgreSQL separados pelo limite inevitável do provedor.

## Mudança

- claim CTE ordenado usa `FOR UPDATE SKIP LOCKED`, limite 100/500 máximo;
- UUID persistido produz jobId estável e recuperação após dois minutos;
- enqueue recebe somente IDs/chave; falha libera o claim exato;
- execução muda AGENDADA→PROCESSANDO por compare-and-set tenant-aware;
- duplicata retorna antes de carregar associações ou enviar;
- batch vazio usa debug; somente trabalho/falha gera log operacional info/error;
- sucesso limpa claim; falha explícita fica ERRO;
- três índices parciais atendem unicidade, due scan e recuperação de claim;
- companyId passa a NOT NULL após precheck fail-closed de legado sem owner;
- mídia passa a fornecer a sessão Baileys real, não o model Whatsapp.

## Evidência

- backup `pre-1.27-20260803.dump`, modo 0600, 212.985 bytes;
- SHA-256 `b3ad617f013ae401c7424c2ef4328b82aa7d2a69c8440a81cc0ceba3813e56fc`;
- restore e migration `up → down → up` em 38–66 ms;
- laboratório: 20 claims em 7/7/6/0, 20 IDs/UUIDs únicos;
- laboratório: um de dois executores iniciou; órfão preservou UUID;
- gate: 46 suítes/178 testes e builds backend/frontend;
- produção: migration 170 ms, schema/índices/NOT NULL confirmados;
- runtime: 1 claim, 1 executor e 1 duplicata ignorada, sem envio externo;
- linha sintética removida; tabela retornou a zero;
- API 1.27, smoke e restart Bull em 568 ms aprovados;
- sem conteúdo de cliente no Redis ou log por contrato.

## Compatibilidade e rollback

Migration aditiva, nullable e reversível. Estados existentes continuam válidos;
o banco atual não contém agendamentos. Rollback: imagem e migration 1.26.

## Como esta entrega ainda pode falhar?

- crash após PROCESSANDO pode deixar ocorrência ambígua para revisão manual;
- WhatsApp não oferece exactly-once documentado;
- envio real, mídia e recorrência dependem de conta canário;
- Redis/AOF ainda pode perder a fila, embora o claim órfão seja recuperável;
- campanha e mensagem avulsa ainda têm janelas próprias de duplicação.
