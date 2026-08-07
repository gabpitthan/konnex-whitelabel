# Problemas conhecidos

| ID | Severidade | Estado | Problema |
|---|---|---|---|
| ENG-001 | Alto | parcial | Há 46 suítes/178 testes no gate versionado e integrações Redis 7; a cobertura integral do CRM continua pendente. |
| SEC-001 | Crítico | parcial | A 1.33 fechou o que era comprovadamente explorável: duas rotas de relatório sem `isAuth` lendo `companyId` da query (leitura anônima de qualquer empresa), `/invoices/list` sem `isAuth`, `UserController.list` aceitando `companyId` do cliente, e três endpoints da API externa dependendo de um `COMPANY_TOKEN` global. Contrato de regressão no gate. **Continua aberto:** o teste negativo real entre duas empresas — depende de criar uma segunda empresa, e a produção tem uma só. |
| SEC-002 | Alto | aberto | `apiCompanyRoutes` (criar/listar/remover empresas, planos, faturas, usuário por e-mail) é autenticado por um único `COMPANY_TOKEN` estático do ambiente: sem rotação, sem limite de taxa, sem auditoria. É a API de administração da plataforma e é intencionalmente cross-tenant, mas o segredo único é ponto de falha. Quem comprar o código herda esse desenho. |
| WA-001 | Alto | parcial | QR funciona; envio, recebimento, mídia e reconexão aguardam teste real. |
| FE-001 | Alto | aberto | Frontend possui 105 vulnerabilidades npm reportadas no build. |
| BE-001 | Alto | parcial | Axios corrigido na 1.24, Bull Board removido na 1.30 e `request` removido na 1.31; imagem runtime caiu a 67/4 críticas. Outras famílias legadas permanecem. |
| OPS-001 | Alto | mitigado | Backend/frontend possuem healthchecks; faltam monitor externo, SLO e alerta. |
| OBS-001 | Médio | parcial | Timestamp ISO UTC e métricas PostgreSQL chegaram na 1.22; faltam request ID, SLO e alerta externo. |
| FE-002 | Médio | aberto | Bundle principal grande e muitos avisos legados de lint. |
| WA-002 | Crítico | parcial | Auth state e lifecycle possuem lease/fencing; falta propagar o fence às transações de domínio e completar o registry de disposers. |
| JOB-001 | Alto | parcial | Retenção/telemetria/shutdown e claim de Schedule chegaram; campanha e mensagem avulsa ainda precisam idempotência por efeito externo. |
| DB-001 | Alto | confirmado | Existem queries interpoladas e fluxos críticos sem garantia explícita de transação/afterCommit. |
| WA-003 | Alto | mitigado | A identidade LID foi resolvida na 1.32 lendo `key.senderPn`/`participantPn` do próprio 6.7.22, sem esperar a v7. O upgrade para v7 continua pendente por suporte, e exige laboratório (ESM, auth, protobuf). |
| WA-005 | Alto | aberto | Contatos 2 e 3 de produção já estão gravados com LID no campo `number`. Não há migration de merge: mesclar contato automaticamente é arriscado. Reavaliar quando houver base acumulada. |
| WA-006 | Médio | aberto | `ImportContactsService` (importação da agenda do telefone) e `groups.update` ainda derivam `number` direto do id. Não exercitados em produção. |
| RT-001 | Médio | aberto | Mais de cem emissores usam namespaces numéricos e dependem temporariamente da normalização central para `/workspace-N`. |
| TEST-001 | Médio | aberto | QA Socket.IO runtime ainda é temporário; falta incorporá-lo como E2E permanente com dois tenants isolados. |
| WA-004 | Alto | mitigado | `server-cluster.ts` falha explicitamente; escala horizontal aguarda CAS transacional nas mutações de domínio. |
| REDIS-001 | Alto | parcial | Auth state v2 possui envelope/checksum e purge sem `KEYS`; batches, manifesto e restore ensaiado continuam pendentes. |
| ENG-002 | Médio | aberto | Lint global voltou a executar e expõe 2.975 problemas legados; arquivos novos da 1.10 passam isoladamente. |
| OPS-002 | Médio | parcial | Shutdown fecha WhatsApp, Socket.IO e Bull; Sequelize e os demais clientes Redis ainda não têm encerramento explícito central. |
| API-003 | Alto | parcial | Telemetria segura chegou na 1.21 e detecta um legado ativo; falta rotação coordenada, observar 30 dias e remover plaintext. |
| DB-002 | Alto | parcial | Pool e `pg_stat_statements` entregues; faltam janela representativa, timeouts por workload e alerta de espera. |
| REDIS-002 | Alto | aberto | Auth/lease, cache e filas compartilham Redis; separar papéis antes de eviction ou escala horizontal. |
| MSG-001 | Alto | parcial | Contact/Ticket e Message usam commits fenced separados; caminhos auxiliares e atomicidade integral da ingestão ainda requerem canário/outbox. |
| SCHED-001 | Alto | mitigado | Claim/CAS evita concorrência; a 1.29 oferece decisão humana auditável para PROCESSANDO ambíguo, sem reenvio automático. Canário real permanece pendente. |
| OPS-003 | Alto | mitigado | Rollout 1.13 reiniciou por drop de constraint dependente; schema ficou intacto e a regra foi incorporada. |

Problemas corrigidos pertencem ao changelog e aos READMEs de versão, não devem continuar descritos como falhas atuais.
