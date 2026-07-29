# Relatório de qualidade — versão 1.14

Data: 2026-07-29  
Resultado: aprovado com riscos residuais documentados

## Verificações

- TypeScript/backend: aprovado;
- regressão automatizada: 13 suítes, 48 testes, zero falhas;
- build Docker backend/frontend: aprovado;
- auditoria estática de lookups ativos de Message por `wid`: todos incluem
  `companyId`;
- deploy Compose: aprovado;
- API `/version`: `1.14`;
- smoke frontend/API: aprovado antes e depois do restart;
- migration: nenhuma pendente;
- shutdown: `SIGTERM`, recursos fechados em 4 ms.

## Segurança e desempenho observados

- o build do frontend reportou 105 vulnerabilidades no grafo npm, sendo 4
  críticas; o risco permanece aberto em `FE-001`;
- o bundle principal comprimido mede 1,68 MB e permanece em `FE-002`;
- não foi aplicada correção automática forçada porque atualizações maiores sem
  análise podem introduzir incompatibilidades e não demonstram explorabilidade
  no artefato entregue.

## Limites

O lote protege o tenant no identificador externo de Message. Ele não libera
escala horizontal do WhatsApp: Ticket, Contact e o fence da sessão ainda devem
participar da mesma unidade transacional.
