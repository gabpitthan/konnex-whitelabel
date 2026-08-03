# Whitelabel Whaticket — versão 1.28

## Objetivo

Tornar o envio de campanhas tenant-aware e resistente a duplicatas de Bull,
preservando as duas fases de confirmação/conteúdo e mantendo explícita a janela
ambígua entre o efeito externo no WhatsApp e o commit PostgreSQL.

## Entregue

- `CampaignShipping.companyId` obrigatório e coerente com a campanha por FK
  composta;
- FK obrigatória de contato alinhada para `ON UPDATE/DELETE CASCADE`, evitando
  a combinação inválida entre `NOT NULL` e a ação histórica `SET NULL`;
- unicidade por tenant/campanha/contato e máquina de estados validada por CHECK;
- UUID persistido por fase, `jobId` estável e payload Redis somente com IDs,
  tenant e chave;
- compare-and-set `PENDING → PROCESSING` antes de carregar contato ou enviar;
- confirmação concorrente `AWAITING_CONFIRMATION → PENDING` com nova UUID;
- recuperação bounded de `PENDING` quando o dual write PostgreSQL/Redis falha;
- falhas chegam ao Bull e ficam `ERROR`; crash em `PROCESSING` não é reenviado
  automaticamente;
- cancelamento muda o estado persistente antes da limpeza best-effort no Redis;
- scanner deixou de interpolar ID em SQL e usa CAS para iniciar campanha;
- show/update/delete/media/cancel/restart usam o `companyId` autenticado.
- create/update validam ContactList, Whatsapp, User e Queue no mesmo tenant;
- somente o job único de expansão carrega contatos; preparação e disparo usam
  consultas leves, eliminando o padrão de carregamento O(N²) do legado.
- índice parcial usa a ordem global `updatedAt,id` do scanner e `INCLUDE` dos
  metadados retornados, em vez de começar por um tenant não filtrado.

## Pesquisa e decisão

Bull 3 é at-least-once e pode executar novamente após stall. PostgreSQL
documenta `SKIP LOCKED` para consumidores concorrentes de tabelas tipo fila e
`UPDATE RETURNING` como a prova das linhas realmente alteradas. Outbox pode
republicar e ainda exige consumidor idempotente. Baileys não documenta dedupe
servidor-a-servidor para repetição de `messageId`.

Por isso, a versão não promete exactly-once. O CAS elimina concorrência
automática; depois de `PROCESSING`, uma queda permanece visível para decisão
humana. Campanhas com áudio podem produzir texto e mídia na mesma fase, então
uma queda entre esses dois efeitos também é explicitamente ambígua.

Fontes:

- https://docs.bullmq.io/bull/important-notes
- https://www.postgresql.org/docs/16/sql-select.html
- https://www.postgresql.org/docs/16/sql-update.html
- https://www.postgresql.org/docs/16/explicit-locking.html
- https://microservices.io/patterns/data/transactional-outbox.html
- https://microservices.io/patterns/communication-style/idempotent-consumer.html
- https://github.com/WhiskeySockets/Baileys
- https://baileys.wiki/docs/socket/handling-messages/

## Banco, desempenho e cache

O baseline de produção tinha zero campanhas/envios; `CampaignShipping` ocupava
24 KiB e possuía apenas PK e índice por campanha. Foram criados somente os
índices correspondentes à unicidade e ao scanner `PENDING`. O lote do scanner
é 100, limitado a 500, e ordenado por `updatedAt,id`. Nenhum cache, pool ou
parâmetro PostgreSQL/Redis foi alterado sem evidência de gargalo.

Backup `pre-1.28-20260803.dump` (modo 0600, 214.332 bytes), SHA-256
`67a1a7aedd17decb2eaef0b23542996dd727e1e4eba7a40a2bea39e45f41e3e2`.
O restore laboratorial final aplicou a cadeia das três migrations em
`up/down/up` em 232/162/255 ms. Dois executores
concorrentes produziram CAS 1/0; duas confirmações concorrentes também 1/0.

O gate completo aprovou 52 suítes/197 testes e ambos os builds. Produção
aplicou estado/FK/índice em 162/51/57 ms; prova transacional com rollback repetiu início
1/0 e confirmação 1/0, deixando zero linhas sintéticas. API 1.28, frontend,
smoke e restart foram aprovados; seis filas fecharam sem falha em 557 ms.

## Limites e rollback

- canal WhatsApp real continua dependente de conta canário;
- `PROCESSING` órfão precisa de tela/procedimento de reconciliação;
- o Redis de filas continua compartilhando a instância durável de auth/lease;
- rollback: migration `down` e imagem 1.27; o backup fica fora do Git.
