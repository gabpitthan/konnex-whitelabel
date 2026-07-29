# Whitelabel Whaticket — versão 1.13

Data: 2026-07-29  
Estado: publicada

## Objetivo

Garantir idempotência tenant-aware e commit atômico na criação de mensagens.

## Escopo

- unique constraint em `Messages(companyId, wid)`;
- migration aborta se detectar duplicidades;
- `upsert`, reload e ajustes na mesma transação;
- Socket.IO somente depois do commit;
- remoção de um índice simples exatamente redundante;
- regressões de rollback, tenant inválido e ordem persistência/emissão.

## Migration e rollback

A migration é condicionada à ausência de duplicidades e não altera mensagens.
O rollback remove a nova constraint e restaura o índice simples removido.
Antes do deploy foi comprovado que a produção tem zero grupos duplicados.

`Messages_id_key` foi preservada porque foreign keys legadas dependem dela.

## Evidência

- backup binário pré-migration criado com permissão 600;
- restore real aprovado em banco temporário com 57 tabelas;
- SHA-256:
  `ad43c7b98d7cf3f02f6c5dda23eb6d1a9f7b5201b51b83bb914b7e0c23eb8618`;
- 12 suítes e 47 testes aprovados;
- migration corrigida aplicada em 74 ms;
- constraint `messages_company_wid_unique` confirmada;
- zero grupos duplicados após migration;
- readiness e smoke da API 1.13 aprovados.
- restart final fechou recursos em 2 ms e retornou sem migrations pendentes.

## Incidente de rollout

A primeira migration tentou remover `Messages_id_key` por parecer redundante
com a primary key. PostgreSQL recusou porque foreign keys dependem diretamente
dela; o backend entrou em restart loop, sem registrar a migration. A migration
foi corrigida, a constraint preservada e o serviço recuperado. Nenhum dado ou
schema foi alterado pela tentativa falha. A duração exata da indisponibilidade
não foi medida com precisão e não será inventada.

## Limites

- updates de Ticket executados pelos handlers antes/depois deste serviço ainda
  precisam entrar na mesma transação e receber o fence WhatsApp;
- buscas legadas por `wid` sem `companyId` continuam em auditoria;
- conta canário real não faz parte deste lote.
