# Konnex Whitelabel — versão 1.29

Estado: publicada em 2026-08-03.

## Objetivo

Resolver estados `PROCESSANDO/PROCESSING` cujo efeito WhatsApp ficou ambíguo,
sem transformar recuperação operacional em reenvio cego.

## Entrega

- tela administrativa “Reconciliação de envios” com pendências e histórico;
- ações reconhecer/rearmar com justificativa e aviso de possível duplicação;
- tenant e perfil admin revalidados no PostgreSQL;
- row lock e CAS pelo UUID exato do dispatch;
- auditoria e transição na mesma transação;
- recorrência de Schedule compartilhada com o worker normal;
- confirmação/conteúdo de campanha tratados como fases distintas;
- índices parciais tenant-first e limites de 200 registros;
- fundação pública do GitHub: README, banner, CI, segurança e contribuição.

## Por que não há retry automático

Bull informa execução, não confirmação exactly-once do WhatsApp. Depois de uma
interrupção, o banco não consegue distinguir “não enviado” de “enviado antes do
crash”. Rearmar é uma nova tentativa consciente; reconhecer registra que o
operador verificou o efeito externo. Nenhuma das ações inventa prova de entrega.

## Segurança e integridade

- nenhuma mensagem, número ou payload de fila aparece na lista/auditoria;
- UUID é token opaco de concorrência e muda ao rearmar campanha;
- justificativa tem CHECK de tamanho e transições possuem CHECK semântico;
- usuário removido preserva a auditoria com ator nulo;
- campanha inativa não pode ser rearmada;
- índice começa por companyId e não mistura tenants.

## Evidência final

- backup: `/root/whitelabel-whaticket-backups/pre-1.29-20260803.dump`, modo
  `0600`, 218.216 bytes, SHA-256
  `d0454ca5370ff4aef2ba72d31c6b077e2c9369156d82bf4837df431c8814ba7a`;
- restore PostgreSQL 16 aprovado;
- migration final up/down/up: 143/48/107 ms reportados pelo Sequelize;
- laboratório encontrou timestamp inexato por microssegundos e confirmou a
  correção UUID com 1 sucesso/1 conflito/1 auditoria;
- gate completo: 57 suítes/212 testes e builds backend/frontend;
- produção: migration 191 ms, DDL confirmado e concorrência 1 sucesso/1
  conflito/1 auditoria, seguida de limpeza 0/0;
- navegador autenticado desktop/mobile: reconhecer→auditar 200, lista atualizada,
  zero overflow, console error, pageerror ou request failure;
- restart total 3.070 ms, shutdown de seis filas sem falha em 542 ms, versão
  1.29 e zero migrations pendentes.

## Rollback

Antes do uso do recurso: migration `down` e imagem 1.28. Depois de decisões
reais, preservar/exportar auditorias antes de remover a tabela. Rearmar pode
produzir efeito externo e não é desfeito pela migration.

## Limites

- exatamente-uma-vez no WhatsApp não é prometido;
- conta canário real permanece necessária;
- mensagem avulsa ainda não possui reconciliação equivalente;
- cache não foi adicionado, pois a leitura exige consistência atual e não há
  evidência de gargalo.
