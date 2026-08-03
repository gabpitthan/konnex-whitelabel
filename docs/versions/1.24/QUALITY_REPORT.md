# Relatório de qualidade — versão 1.24

Data: 2026-08-02
Resultado: publicada

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| remover Axios vulnerável | versão 1.18.0 fixada | audit sem Axios |
| supply chain | tag/integridade/provenance | npm signatures + gitHead |
| backpressure | três perfis com budgets | 6 contratos + runtime |
| segredo em erro | redaction + tokens fora da URL | serialização automatizada |
| regressão | composição central | varredura de imports/Infinity |

## Gates

- preflight: aprovado;
- testes: 37 suítes/124 testes;
- builds Docker backend/frontend: aprovados;
- produção: API 1.24 e smoke aprovados;
- runtime: Axios 1.18.0 e seis budgets conferidos;
- banco/cache: sem mudança; nenhuma migration.

## Autoavaliação 0–2

| Dimensão | Nota | Evidência/limite |
|---|---:|---|
| entendimento e aceite | 2 | baseline e critérios registrados |
| causa/evidência | 2 | audit, usos e Infinity reproduzidos |
| corretude funcional | 2 | compilação, contratos e regressão |
| persistência/integridade | 2 | sem estado novo |
| auth/tenant/segurança | 1 | redaction provada; provedores reais pendentes |
| regressão/compatibilidade | 2 | 37 suítes e builds |
| UX/acessibilidade | 1 | nenhuma UI mudou; frontend compilou |
| falhas/resiliência | 2 | budgets e serialização exercitados |
| performance | 2 | budgets e PostgreSQL medidos |
| observabilidade | 1 | erros pós-rollout observados; sem métrica HTTP |
| runtime real | 1 | versão/config/smoke; integrações reais pendentes |
| deploy/rollback | 2 | deploy aprovado; imagem 1.23 disponível |
| documentação/memória | 2 | fontes canônicas sincronizadas |

Nenhuma dimensão crítica recebeu zero. A entrega é publicada com limitações
explícitas; não declara os provedores externos como validados fim a fim.

## Como esta entrega ainda pode falhar?

- payload legítimo pode exceder budget e exigir ajuste medido;
- URL configurável pode atingir rede interna por SSRF/DNS rebinding;
- logging que não chama `AxiosError.toJSON()` pode exigir sanitização própria;
- outras famílias vulneráveis continuam no grafo legado.
