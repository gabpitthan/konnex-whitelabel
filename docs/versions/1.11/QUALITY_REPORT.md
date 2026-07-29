# Relatório de qualidade — 1.11

## Escopo auditado

- lease Redis, TTL, heartbeat, release e falha fechada;
- fencing monotônico PostgreSQL e CAS de lifecycle;
- persistência/purge do auth state por owner;
- concorrência entre start e operações destrutivas;
- perda de ownership, retries e shutdown;
- limites para escala horizontal;
- logs sensíveis nos caminhos críticos alterados.

## Pesquisa e decisões

A implementação foi confrontada com documentação primária do Redis,
PostgreSQL, ioredis e Baileys. As fontes e as correções resultantes estão no
`ADR-0003-whatsapp-lease-fencing.md`.

## Evidência pré-deploy

- preflight: aprovado;
- TypeScript/backend: aprovado em imagem Docker;
- testes P0: 8 suítes, 34 testes, todos aprovados;
- integração Redis 7: TTL, ABA e auth write atômico aprovados;
- frontend produção: aprovado;
- backend produção: aprovado.

## Descobertas corrigidas durante a auditoria

- troca de `PSETEX` por `SET NX PX`;
- offline queue do ioredis desativada;
- hash tag comum para lease e auth state v2;
- purge automático removido de caminhos de erro/QR;
- operações destrutivas serializadas e protegidas pelo lease;
- `relayMessage` incluído no guard central;
- exceções e payloads sensíveis removidos dos logs críticos alterados;
- teste de mutex tornado determinístico por sinal explícito.

## Riscos conhecidos

- handlers de domínio ainda têm janela TOCTOU e impedem cluster seguro;
- não houve canário WhatsApp real;
- existem logs legados fora dos caminhos críticos deste lote;
- npm reporta 77 vulnerabilidades no backend e 105 no frontend;
- bundle principal permanece com 1,68 MB gzip.

## Gate pós-deploy

Comprovado:

- migration aplicada em 219 ms;
- coluna `sessionFence` e sequence confirmadas;
- frontend ativo e API em `1.11`;
- smoke aprovado antes e depois do restart;
- `SIGTERM` recebido diretamente pelo processo;
- recursos fechados em 1 ms;
- backend recuperado sem migration pendente.

Não comprovado:

- conta canário WhatsApp real;
- perda deliberada de lease com uma sessão real conectada;
- QA autenticado desktop/mobile.
