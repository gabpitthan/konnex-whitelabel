# Konnex Whitelabel — versão 1.30

Estado: publicada em 2026-08-03.

## Objetivo

Remover uma superfície administrativa crítica e dormente sem modificar a
execução, integridade ou desempenho das filas de negócio.

## Baseline e decisão

- produção: Bull Board desabilitado, Redis ACK ausente e credenciais ausentes;
- único uso: import e rota condicional `/admin/queues` no processo HTTP;
- audit runtime antes: 76 achados, 9 críticos;
- upstream moderno usa pacotes modulares, enquanto 0.5.0 arrastava EJS,
  React Highlight e uma cópia antiga do Bull;
- remover é menor e mais seguro que migrar uma função sem usuário comprovado.

## Entrega

- `bull-board` e `basic-auth` removidos do manifesto e lockfile;
- rota, middleware e variáveis exclusivas removidos;
- produtores, consumers, DLQ, retenção, telemetria e shutdown preservados;
- teste de contrato impede reintrodução silenciosa.

## Evidência atual

- audit runtime depois: 72 achados, 7 críticos;
- Bull Board, EJS e React Highlight ausentes do grafo;
- gate completo: 58 suítes/214 testes e builds backend/frontend;
- produção: `/admin/queues` 404 e quatro pacotes ausentes da imagem;
- smoke confirmou frontend e API 1.30;
- restart fechou as filas/recursos e retornou saudável, sem migration pendente.

## Escala, dados e rollback

Não há migration, cache, índice, mudança de pool ou payload. A remoção reduz o
grafo carregável e não toca no throughput das filas. Rollback é a imagem 1.29.

## Como ainda pode falhar

Uma automação externa não inventariada pode tentar acessar `/admin/queues`.
Uma futura UI de filas deve ser implantada explicitamente com o stack modular
atual, autorização administrativa e acesso de rede restrito; reativar o pacote
legado não é rollback aceitável de longo prazo.

## Autoavaliação 0–2

Entendimento/aceite, causa, corretude, integridade, segurança, regressão,
falhas, performance, observabilidade, runtime, deploy/rollback e documentação:
`2`. UX/autenticação/tenant: `2` por não haver jornada visual nem dado de
tenant alterado, e pela negativa HTTP 404. Persistência: `2`, não aplicável a
dados e confirmada por restart. Nenhuma dimensão crítica ficou em `0`.
