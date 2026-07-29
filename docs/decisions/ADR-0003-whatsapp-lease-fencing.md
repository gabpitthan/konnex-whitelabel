# ADR-0003 — Lease e fencing das sessões WhatsApp

Data: 2026-07-29  
Estado: aceita para a fundação 1.11; escala horizontal ainda bloqueada

## Contexto

Single-flight e generation em memória não impedem dois processos de abrirem a
mesma sessão. Um processo também pode pausar além do TTL, perder o lease e
retomar callbacks antigos.

## Pesquisa primária

- A documentação oficial do Redis exige valor aleatório no lock, release
  condicional e recomenda fencing tokens para processos que podem pausar:
  [Distributed Locks with Redis](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/).
- Scripts Lua são atômicos no Redis:
  [Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/).
- Scripts multi-key em Redis Cluster precisam operar no mesmo slot; hash tags
  garantem isso:
  [Scale with Redis Cluster](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/).
- `PSETEX` é legado; código novo deve usar `SET` com `PX`:
  [PSETEX](https://redis.io/docs/latest/commands/psetex/).
- O ioredis enfileira comandos quando a conexão não está pronta por padrão.
  Para ownership isso permitiria execução tardia, por isso a fila offline foi
  desativada:
  [ioredis — Offline Queue](https://github.com/redis/ioredis).
- `nextval` é atômico e entrega valores distintos entre sessões; gaps e
  rollback não são defeitos para fencing:
  [PostgreSQL sequence functions](https://www.postgresql.org/docs/current/functions-sequence.html).
- O Baileys atualiza credenciais e Signal keys durante mensagens, não apenas no
  pareamento; portanto todos esses writes precisam ser fenced:
  [Baileys — Saving & Restoring Sessions](https://github.com/WhiskeySockets/Baileys/blob/master/README.md).
- A política de segurança upstream informa que logs podem conter JIDs,
  metadados e credenciais, e que a linha 6.x não recebe suporte:
  [Baileys Security Policy](https://github.com/WhiskeySockets/Baileys/security).
- O trabalho original sobre leases ressalta que o mecanismo depende de tempo e
  deve tratar falhas de host/rede explicitamente:
  [Gray e Cheriton, SOSP 1989](https://www.cs.cmu.edu/afs/cs.cmu.edu/academic/class/15712-s12/www/papers/gray89.pdf).

## Decisão

1. Alocar fence monotônico em uma sequence PostgreSQL.
2. Persistir o fence corrente em `Whatsapps.sessionFence`.
3. Adquirir Redis com `SET key value NX PX ttl`.
4. Usar token opaco mais fence como valor exato do lease.
5. Renovar, verificar, escrever auth e liberar somente por Lua compare-value.
6. Usar `{companyId:whatsappId}` como hash tag tanto no lease quanto no auth v2.
7. Desabilitar offline queue e limitar retries do cliente Redis usado pelo
   lifecycle para falhar fechado.
8. Aplicar CAS PostgreSQL por `id + companyId + sessionFence` nos estados do
   lifecycle.
9. Fechar o socket sem logout/purge quando o ownership for perdido.
10. Manter `server-cluster.ts` bloqueado.

## Correções feitas após pesquisar a implementação

- `PSETEX` foi substituído por `SET NX PX`.
- A fila offline padrão do ioredis foi desativada.
- O delete fenced não toca a chave legada `sessions:{whatsappId}`, pois ela não
  compartilha o hash tag tenant-aware e causaria `CROSSSLOT`; o legado fica
  para garbage collection controlado.
- O logger interno do Baileys foi silenciado; o projeto mantém apenas eventos
  de lifecycle sanitizados.
- A sequence permanece `NO CYCLE` e o CAS da linha rejeita qualquer fence
  reutilizado ou inferior, inclusive após recuperação anômala.

## Limitações

O guard no início de um handler não torna atômicas mutações posteriores em
mensagens, tickets, contatos e contadores. Essas operações ainda precisam
validar o fence dentro da mesma transação PostgreSQL. Até isso acontecer, a
1.11 é uma fundação de exclusividade, não autorização para múltiplas réplicas.
