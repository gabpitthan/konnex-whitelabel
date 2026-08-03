# Relatório de qualidade — 1.27

## Evidência

- dados: backup 0600/hash e restore up/down/up aprovados;
- concorrência: 20 claims únicos em quatro workers, CAS 1/2;
- tenant: owner NOT NULL e compare-and-set exige companyId;
- privacidade: job contém somente três metadados, sem contato/conteúdo;
- desempenho: batch 100/500 e três índices de workload comprovado;
- runtime: migration 170 ms, API 1.27, smoke e restart 568 ms;
- limpeza: linha sintética removida e tabela voltou a zero.

## Autoavaliação Jarvis (0–2)

| Dimensão | Nota | Evidência |
|---|---:|---|
| Entendimento e aceite | 2 | dual writes e limite externo mapeados |
| Causa e evidência | 2 | scanner/snapshot/concorrência reproduzidos |
| Corretude funcional | 2 | 46 suítes/178 testes e runtime CAS |
| Persistência/integridade | 2 | backup/restore/migration/claims únicos |
| Auth/tenant/segurança | 2 | NOT NULL, CAS tenant e payload mínimo |
| Regressão/compatibilidade | 2 | gate e builds completos |
| Falhas/resiliência | 2 | recovery/release/duplicata cobertos |
| Performance | 2 | batch/index/concorrência PG16 medidos |
| Observabilidade | 2 | eventos agregados; vazio em debug |
| Runtime real | 1 | DB/Redis reais, sem WhatsApp canário |
| Deploy/rollback | 2 | deploy e down/imagem/backup disponíveis |
| Memória/documentação | 2 | fontes persistentes sincronizadas |

Nenhuma dimensão crítica recebeu zero.

## Como ainda pode falhar

- crash após efeito WhatsApp e antes do status deixa PROCESSANDO ambíguo;
- reconciliação ainda é manual e não possui alerta dedicado;
- provedor não garante exactly-once nem dedupe por messageId;
- recorrência/mídia real não foram exercitadas;
- batch/índices precisam ser reavaliados quando existir volume representativo.
