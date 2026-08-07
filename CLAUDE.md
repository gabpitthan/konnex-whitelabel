# Whitelabel Whaticket — instruções permanentes

CRM WhatsApp **multiempresa em produção**, com dados reais de clientes. Nada aqui é ambiente de testes.

# JARVIS BOOT

Este repositório é governado pelo ENGINEERING OS / JARVIS.

Antes de qualquer tarefa:

1. leia `.engineering/jarvis/JARVIS_CORE.md` por completo e execute o BOOT definido nele;
2. carregue `.engineering/jarvis/ENGINEERING_OS_INDEX.md`;
3. classifique a task T0–T4 e selecione módulos por `.engineering/jarvis/runtime/MODULE_ROUTER.md`;
4. para T2+, faça o lookup dirigido da Spec segundo `.engineering/jarvis/runtime/SPEC_LOOKUP_PROTOCOL.md` e preencha o Policy Coverage antes de mudança material;
5. decida SOLO / ASSISTED / SWARM conforme a topologia da task e as capabilities reais de `.engineering/jarvis/runtime/CAPABILITY_MATRIX.md`;
6. verifique o resultado real antes de declarar DONE.

Este é um produto em produção com tráfego real: trate deploy, migration, dado de cliente e isolamento de tenant como **T3/T4**, com os gates de risco, rollback e verificação que o Core exige.

Não duplique aqui a política do ENGINEERING OS. O que segue é o que o OS **não pode descobrir sozinho**: fatos, restrições e lições deste projeto.

## Precedência entre as fontes

Existem dois documentos com o nome "Jarvis" neste servidor. A ordem é:

1. **ENGINEERING OS** (`.engineering/jarvis/`) — regra geral de engenharia, prevalece.
2. **Este arquivo e `AGENTS.md`** — fatos e restrições deste projeto; prevalecem sobre o OS apenas onde forem *mais restritivos*, nunca para afrouxar um gate.
3. `docs/JARVIS_ENGINEERING_SYSTEM.md` — protocolo anterior, em prosa. Continua válido como **contexto histórico e detalhe operacional do projeto**, mas deixou de ser a autoridade em divergência. Onde conflitar com o ENGINEERING OS, o OS vence.

Se encontrar contradição real entre as três, resolva pelo POLICY PRECEDENCE do Core e registre a contradição — não invente uma quarta política.

## Passo 0, antes de qualquer documento

**Rode `scripts/product-state.sh`.** Ele mostra o estado do **produto** — volume real, status das conexões, tráfego das últimas 24h, contatos sem telefone. Os documentos descrevem o que foi construído; só este script diz se alguém consegue usar.

Depois: `AGENTS.md`, `PROJECT_STATE.md`, `docs/project/CURRENT.md`, `docs/project/ISSUES.md`, `tasks/ACTIVE.md`, `VERSION`, `git status`. Esses arquivos mudam a cada lote — **nunca assuma o estado de memória, releia.**

## Prioridade: valor antes de rigor

As versões 1.17–1.31 passaram em todos os gates com nota alta enquanto a produção tinha 0 mensagens, 0 tickets e 0 contatos. O protocolo media corretude do lote com rigor e entrega de valor com zero — foi assim que 15 lotes seguidos blindaram caminhos de código que nunca executaram uma vez.

Portanto, antes de escolher um lote:

- **A prioridade declarada é produto funcionando e clientes primeiro.** Melhorias, refatoração e endurecimento de segurança vêm depois, salvo instrução em contrário de Gabriel.
- **Não escolher lote a partir de `ROADMAP.md` / `ISSUES.md` isoladamente.** Ambos são 100% técnicos e não têm critério de "isto destrava venda?".
- Se `product-state.sh` mostrar que uma jornada central nunca foi exercitada, ela vem antes de qualquer dívida técnica.
- "Passou no gate" é condição **necessária e nunca suficiente**.

Esta seção é a aplicação local do PRODUCT COMPLETION GATE do Core, e o motivo dela existir foi pago com 15 lotes.

## Regras que não se negociam

- Toda leitura/escrita/cache/job/socket de dado de tenant escopada por `companyId`, validada **no backend**.
- Um lote funcional = exatamente uma subversão em `VERSION` (hoje `1.32`), incrementada antes do commit, com entrada em `CHANGELOG.md` e README em `docs/versions/X.Y/`.
- Encerramento: `scripts/preflight.sh` → `scripts/quality-gate.sh` → (em deploy) `scripts/smoke-test.sh` → autoavaliação 0–2 de `docs/DEFINITION_OF_DONE.md`.
- Nota 0 em corretude, persistência/integridade, auth/tenant, runtime real ou deploy/rollback **bloqueia a conclusão** — média alta não compensa.
- Build passar e HTTP 200 **não provam nada**. Rota autenticada exige navegador real, console e screenshot desktop + mobile. **Este ambiente não tem browser nem screenshots** (ver CAPABILITY_MATRIX): a verificação visual depende de Gabriel, e o agente deve declarar UNVERIFIED em vez de alegar que verificou.
- Commitado não é implantado. A prova sai de dentro da imagem em execução e do `dist/`, não do repositório.
- Nunca ler, imprimir ou copiar `credentials.txt` / `.env`. O hook `block-secrets` nega de fato — se ele bloquear, mude a abordagem, não contorne.
- Regra P0: falha em auth, isolamento multi-tenant, integridade de dados, WhatsApp, tickets/mensagens ou tela branca **congela novas features** na superfície afetada até causa comprovada + correção + regressão + validação runtime + observação pós-deploy.
- Snapshot (`scripts/create-version-snapshot.sh`) só quando Gabriel declarar a versão pronta.
- Não alterar nem reiniciar outros projetos do servidor.
- Cada lote aprovado termina com push para `main` de `gabpitthan/konnex-whitelabel`, com o SHA remoto verificado. Deve seguir sendo o único repositório público da conta, salvo ordem explícita.

## Pesquisa antes de decidir

Decisões sobre arquitetura, banco, cache, filas, segurança, dependências ou infra exigem pesquisa em **documentação primária** e advisories upstream. Pesquisa superficial não autoriza mudança em produção. Registrar fonte, baseline, alternativas, rollout, rollback e "como ainda pode falhar". O detalhamento de escala, pools, índices e cache está em `AGENTS.md`.

## Ambiente

- `claudeuser` está no grupo `docker`. Se o grupo ainda não valeu na sessão, usar `sg docker -c "comando"`.
- Arquivos do repo pertencem a `root`. Em "permission denied" ao editar, trocar o dono do arquivo específico (`sudo chown claudeuser:claudeuser <arquivo>`) — nunca recursivo no repo inteiro. `backend/src`, `scripts`, `docs`, `tasks`, `.git`, `CLAUDE.md` e `AGENTS.md` já pertencem a `claudeuser`.
- Push via `credential.helper store --file=~/.git-credentials-konnex` (0600, fora do repo). Não há `gh` instalado.
- Portas: 8090 frontend, 3007 API; postgres/redis só na rede interna do Docker.
- **Não há mais subagentes nem skills locais neste repositório.** Os antigos (`engenharia`, `qa`, `seguranca`, `operacoes`, `ux` e a skill `whitelabel-engineering`) foram isolados em 2026-08-07; quem decide topologia de agentes agora é o ENGINEERING OS, por `modules/orchestration.md`.

## Referência externa

`/root/reference-crms/` tem clones de CRMs concorrentes (wacrm, DeskcommCRM, ticketz, whaticket-community, chatwoot) **somente para consulta de padrões** — nunca copiar código sem verificar licença, nunca importar como dependência.
