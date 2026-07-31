# Relatório de qualidade — versão 1.21

Data: 2026-07-31
Resultado: publicada

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| nenhum segredo | somente enum `legacy/digest` | revisão e teste middleware |
| sem write extra | contadores no UPSERT existente | teste SQL atômico |
| faturamento íntegro | telemetria fora de `UsedOnDay` | teste digest |
| tenant | query parametrizada por `companyId` | teste do relatório |
| contract seguro | quatro condições cumulativas | SQL + runtime falso |
| DDL leve | dois defaults constantes | docs PostgreSQL + restore |
| entrada segura | normalizador em send/image/check | build + sete casos |

## Gates

- preflight: aprovado;
- testes focados: 5 suítes/28 testes;
- regressão: 33 suítes/113 testes;
- builds Docker: backend/frontend aprovados;
- backup: custom, modo `0600`, SHA-256 registrado;
- restore/migration: `up → down → up`, 31–42 ms;
- produção: migration em 92 ms;
- schema: dois contadores `NOT NULL DEFAULT 0`;
- endpoint admin: 200, tenant atual, readiness falso;
- runtime: API 1.21, frontend 200, shutdown em 2 ms.

## Integridade e escalabilidade

A cardinalidade é fixa em dois tipos e nenhuma identidade de credencial entra
no banco ou logs. O request bem-sucedido continua realizando um único UPSERT.
O relatório lê agregados diários e uma contagem tenant-aware de legados ativos.
Não foi criado cache porque revogação/readiness exigem estado atual correto.

## Limites

O tráfego real ainda usa a credencial legada. A aplicação não pode executar a
rotação sem coordenação com o consumidor que receberá o segredo revelado uma
única vez. O contract permanece bloqueado por desenho.
