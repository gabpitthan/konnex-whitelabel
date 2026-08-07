# Whitelabel Whaticket — instruções permanentes

CRM WhatsApp **multiempresa em produção**, com dados reais de clientes. Nada aqui é ambiente de testes.

## Leia antes de qualquer alteração

0. **Rode `scripts/product-state.sh`.** Antes de qualquer documento. Ele mostra o estado do **produto** — volume real, status das conexões, tráfego das últimas 24h, contatos sem telefone. Os documentos descrevem o que foi construído; só este script diz se alguém consegue usar.
1. `AGENTS.md` — regras permanentes (valem integralmente, seja o agente Codex ou Claude Code).
2. `docs/JARVIS_ENGINEERING_SYSTEM.md` — protocolo vinculante. Em qualquer divergência, ele prevalece.
3. `PROJECT_STATE.md`, `docs/project/CURRENT.md`, `docs/project/ISSUES.md`, `tasks/ACTIVE.md`, `VERSION`, `git status`.

Esses arquivos mudam a cada lote. **Nunca assuma o estado de memória — releia.**

## Prioridade: valor antes de rigor

As versões 1.17–1.31 passaram em todos os gates com nota alta enquanto a produção tinha 0 mensagens, 0 tickets e 0 contatos. O protocolo mede corretude do lote com rigor e entrega de valor com zero — foi assim que 15 lotes seguidos blindaram caminhos de código que nunca executaram uma vez.

Portanto, antes de escolher um lote:

- **A prioridade declarada é produto funcionando e clientes primeiro.** Melhorias, refatoração e endurecimento de segurança vêm depois, salvo instrução em contrário de Gabriel.
- **Não escolher lote a partir de `ROADMAP.md` / `ISSUES.md` isoladamente.** Ambos são 100% técnicos e não têm critério de "isto destrava venda?".
- Se `product-state.sh` mostrar que uma jornada central nunca foi exercitada, ela vem antes de qualquer dívida técnica.
- "Passou no gate" é condição **necessária e nunca suficiente**.

## Como trabalhar

Use a skill `whitelabel-engineering` (`.claude/skills/whitelabel-engineering/`), que coloca você como coordenador do time e delega aos subagentes em `.claude/agents/`: `engenharia`, `qa`, `seguranca`, `operacoes`, `ux`.

`qa` e `seguranca` são somente-leitura por definição — auditam e devolvem achados; quem corrige é `engenharia`.

## Regras que não se negociam

- Toda leitura/escrita/cache/job/socket de dado de tenant escopada por `companyId`, validada **no backend**.
- Um lote funcional = exatamente uma subversão em `VERSION`, incrementada antes do commit, com entrada em `CHANGELOG.md` e README em `docs/versions/X.Y/`.
- Encerramento: `scripts/preflight.sh` → `scripts/quality-gate.sh` → (em deploy) `scripts/smoke-test.sh` → autoavaliação 0–2 de `docs/DEFINITION_OF_DONE.md`.
- Nota 0 em corretude, persistência/integridade, auth/tenant, runtime real ou deploy/rollback **bloqueia a conclusão** — média alta não compensa.
- Build passar e HTTP 200 **não provam nada**. Rota autenticada exige navegador real, console e screenshot desktop + mobile.
- Nunca ler, imprimir ou copiar `credentials.txt` / `.env`.
- Regra P0: falha em auth, isolamento multi-tenant, integridade de dados, WhatsApp, tickets/mensagens ou tela branca **congela novas features** na superfície afetada até causa comprovada + correção + regressão + validação runtime + observação pós-deploy.
- Snapshot (`scripts/create-version-snapshot.sh`) só quando Gabriel declarar a versão pronta.
- Não alterar nem reiniciar outros projetos do servidor (ex: `/root/konnex-os`).

## Pesquisa antes de decidir

Decisões sobre arquitetura, banco, cache, filas, segurança, dependências ou infra exigem pesquisa em **documentação primária** e advisories upstream. Pesquisa superficial não autoriza mudança em produção. Registrar fonte, baseline, alternativas, rollout, rollback e "como ainda pode falhar".

## Ambiente

- `claudeuser` está no grupo `docker`. Se o grupo ainda não valeu na sessão, usar `sg docker -c "comando"`.
- Arquivos do repo pertencem a `root`. Em "permission denied" ao editar, trocar o dono do arquivo específico (`sudo chown claudeuser:claudeuser <arquivo>`) — nunca recursivo no repo inteiro. `backend/src`, `scripts`, `docs`, `tasks` e `.git` já pertencem a `claudeuser`.
- Push está configurado desde 2026-08-07 via `credential.helper store --file=~/.git-credentials-konnex` (0600, fora do repo). Não há `gh` instalado.

## Referência externa

`/root/reference-crms/` tem clones de CRMs concorrentes (wacrm, DeskcommCRM, ticketz, whaticket-community, chatwoot) **somente para consulta de padrões** — nunca copiar código sem verificar licença, nunca importar como dependência.
