# Relatório de qualidade — 1.26

## Evidência

- funcional: handlers rejeitam contrato inválido e propagam falha real;
- integridade: nenhuma migration; failed permanece como DLQ limitada;
- tenant: ACK/mensagem preservam `companyId`, coberto por testes;
- segurança: eventos não contêm payload, texto do erro, token ou tenant;
- resiliência: failed, stalled, erro Redis e falha de close foram exercitados;
- desempenho: baseline sem backlog, Redis 2,31 MiB e retenção bounded;
- runtime: API 1.26, smoke, DLQ induzida e restart aprovados;
- rollback: imagem 1.25, sem schema para reverter.

## Autoavaliação Jarvis (0–2)

| Dimensão | Nota | Evidência |
|---|---:|---|
| Entendimento e aceite | 2 | baseline e critérios registrados |
| Causa e evidência | 2 | falso sucesso e loop ACK reproduzidos |
| Corretude funcional | 2 | 40/168 + 4/14 focados |
| Persistência/integridade | 1 | DLQ real; efeitos externos não exercitados |
| Auth/tenant/segurança | 1 | companyId e log cobertos; sem tenant A/B real |
| Regressão/compatibilidade | 2 | gate, builds e smoke |
| Falhas/resiliência | 2 | failed, close failure e restart |
| Performance | 1 | baseline medido; sem carga representativa |
| Observabilidade | 2 | falha induzida correlacionada |
| Runtime real | 1 | infraestrutura real, sem canal canário |
| Deploy/rollback | 2 | 1.26 publicada; rollback 1.25 |
| Memória/documentação | 2 | fontes persistentes sincronizadas |

Nenhuma dimensão crítica recebeu zero.

## Como ainda pode falhar

- um efeito externo pode ocorrer duas vezes após stall/crash;
- AOF everysec admite pequena janela de perda;
- jobs CPU-bound ainda podem bloquear renovação de lock;
- Redis compartilhado continua ampliando blast radius;
- retenção precisa alerta de saturação e revisão por workload real.
