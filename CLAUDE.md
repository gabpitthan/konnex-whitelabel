# Whitelabel Whaticket — instruções permanentes

CRM WhatsApp **multiempresa em produção**, com dados reais de clientes. Nada aqui é ambiente de testes.

# JARVIS BOOT

Este repositório é governado pelo ENGINEERING OS / JARVIS. Ele é a **única** autoridade de engenharia: não existem mais `AGENTS.md`, `docs/JARVIS_ENGINEERING_SYSTEM.md`, skills nem subagentes neste projeto.

Antes de qualquer tarefa:

1. leia `.engineering/jarvis/JARVIS_CORE.md` por completo e execute o BOOT definido nele;
2. carregue `.engineering/jarvis/ENGINEERING_OS_INDEX.md`;
3. classifique a task T0–T4 e selecione módulos por `.engineering/jarvis/runtime/MODULE_ROUTER.md`;
4. para T2+, faça o lookup dirigido da Spec segundo `.engineering/jarvis/runtime/SPEC_LOOKUP_PROTOCOL.md` e preencha o Policy Coverage antes de mudança material;
5. decida SOLO / ASSISTED / SWARM conforme a topologia da task e as capabilities reais de `.engineering/jarvis/runtime/CAPABILITY_MATRIX.md`;
6. verifique o resultado real antes de declarar DONE.

Produto em produção com tráfego real: trate deploy, migration, dado de cliente e isolamento de tenant como **T3/T4**, com os gates de risco, rollback e verificação que o Core exige.

O que segue não é política de engenharia — é o que o OS **não pode descobrir sozinho**: fatos, restrições e lições deste projeto. Onde for mais restritivo que o OS, prevalece; nunca para afrouxar um gate.

## Passo 0, antes de qualquer documento

**Rode `scripts/product-state.sh`.** Ele mostra o estado do **produto** — volume real, status das conexões, tráfego das últimas 24h, contatos sem telefone. Os documentos descrevem o que foi construído; só este script diz se alguém consegue usar.

Depois: `PROJECT_STATE.md`, `docs/project/CURRENT.md`, `docs/project/ISSUES.md`, `tasks/ACTIVE.md`, `VERSION`, `git status`. Esses arquivos mudam a cada lote — **nunca assuma o estado de memória, releia.**

## Passagem 0 — valor (bloqueante, vem antes de tudo)

As versões 1.17–1.31 passaram em todos os gates com nota alta enquanto a produção tinha 0 mensagens, 0 tickets e 0 contatos. O protocolo media corretude do lote com rigor e entrega de valor com zero — foi assim que 15 lotes seguidos blindaram caminhos de código que nunca executaram uma vez. Estas perguntas são sobre o **produto**, não sobre o lote:

- `scripts/product-state.sh` foi executado **antes** de escolher este lote?
- Qual jornada de cliente este lote destrava ou protege? Se a resposta for "nenhuma", por que ele foi priorizado à frente de uma que destrava?
- As jornadas centrais continuam exercitáveis depois desta mudança — conectar número, receber mensagem, responder, criar empresa?
- O lote toca código que **já executou em produção**, ou está endurecendo um caminho que nunca rodou? Se nunca rodou, provar que roda vem primeiro.
- Existe evidência de tráfego real (`Messages`, `Tickets`, ACK) exercitando o caminho alterado, e não apenas teste sintético?

Nota 0 em qualquer item **bloqueia a conclusão**, exatamente como corretude e auth/tenant. É a aplicação local do PRODUCT COMPLETION GATE do Core, e o motivo de existir foi pago com 15 lotes.

Decorre daí: **produto funcionando e clientes primeiro**; melhorias, refatoração e endurecimento de segurança depois, salvo instrução em contrário de Gabriel. Não escolher lote a partir de `ROADMAP.md` / `ISSUES.md` isoladamente — ambos são 100% técnicos e não têm critério de "isto destrava venda?". "Passou no gate" é condição **necessária e nunca suficiente**.

## Definição de pronto

Uma tarefa só está pronta quando as respostas aplicáveis forem "sim":

- O comportamento pedido funciona de verdade, não apenas renderiza?
- Os dados persistem após atualizar a página e reiniciar o serviço?
- Validações críticas também existem no backend?
- Toda operação multiempresa valida `companyId` no servidor, e foi testado que uma empresa não acessa dados de outra?
- Caminho feliz e falhas relevantes foram exercitados?
- A mudança preserva autenticação, permissões e compatibilidade?
- O mobile continua utilizável quando a tela é afetada?
- Migration é reversível e tem plano de rollback?
- Nenhum segredo ou dado pessoal entrou no Git ou nos logs?
- Build, testes e smoke aplicáveis passaram, e o deploy executa a versão documentada?
- A validação foi além de build e HTTP 200, com fluxo autenticado em navegador real, console/rede inspecionados e evidência visual desktop e mobile?
- Revisões funcional, UX e regressiva foram feitas **separadamente**?
- A entrega transforma a funcionalidade ou apenas aplica tema?
- Documentação e memória descrevem o estado real, com limitações explícitas, "como ainda pode falhar", e fatos/inferências/não-testados separados?

**Gate numérico:** nota 0 em corretude, persistência/integridade, auth/tenant, runtime real ou deploy/rollback impede declarar concluída — média alta não compensa.

**Revisão do diff antes do commit:** `git diff --check`; procurar código temporário, log sensível e credencial; conferir consulta sem escopo de tenant; conferir tratamento de erro e estado de carregamento; conferir compatibilidade de API e banco; registrar os comandos realmente executados.

## Regras que não se negociam

- Toda leitura/escrita/cache/job/socket de dado de tenant escopada por `companyId`, validada **no backend**.
- Um lote funcional = exatamente uma subversão em `VERSION` (hoje `1.32`), incrementada antes do commit, com entrada em `CHANGELOG.md` e README em `docs/versions/X.Y/`. Não incrementar por leitura, diagnóstico sem mudança ou atualização só de documentação. O número principal só muda quando Gabriel declarar a versão pronta.
- Versão exibida no frontend, endpoint `/version`, `package.json` e `VERSION` sempre sincronizados.
- Encerramento: `scripts/preflight.sh` → `scripts/quality-gate.sh` → (em deploy) `scripts/smoke-test.sh` → autoavaliação 0–2 acima.
- Build passar e HTTP 200 **não provam nada**. Rota autenticada exige navegador real: console, rede, desktop claro/escuro e mobile. **Este ambiente tem browser e screenshots** (Playwright, receita em `runtime/CAPABILITY_MATRIX.md`) — a verificação visual é obrigação do agente. Declarar UNVERIFIED só vale para o que realmente não foi verificado, nunca como atalho.
- Commitado não é implantado. A prova sai de dentro da imagem em execução e do `dist/`, não do repositório.
- Nunca ler, imprimir ou copiar `credentials.txt` / `.env`. O hook `block-secrets` nega de fato — se ele bloquear, mude a abordagem, não contorne.
- Regra P0: falha em auth, isolamento multi-tenant, integridade de dados, WhatsApp, tickets/mensagens ou tela branca **congela novas features** na superfície afetada até causa comprovada + correção + regressão + validação runtime + observação pós-deploy.
- Snapshot (`scripts/create-version-snapshot.sh`) só quando Gabriel declarar a versão pronta; nunca incluir `.env`, credenciais, banco, certificados, logs, uploads de clientes ou `node_modules`.
- Baileys fixo em 6.7.22; migração para v7 exige laboratório isolado (breaking changes LID/ESM/auth/protobuf).
- Não alterar nem reiniciar outros projetos do servidor.
- Cada lote aprovado termina com push para `main` de `gabpitthan/konnex-whitelabel`, com o SHA remoto verificado. Deve seguir sendo o único repositório público da conta, salvo ordem explícita.

## Escala, dados e produção

Decisões sobre arquitetura, banco, cache, filas, segurança, dependências ou infra exigem pesquisa em **documentação primária** e advisories upstream; pesquisa superficial não autoriza mudança em produção. Registrar fonte, baseline, alternativas, rollout, rollback e "como ainda pode falhar".

- Considerar simultaneamente escala horizontal, latência, throughput, backpressure, integridade transacional, isolamento por tenant, cardinalidade, crescimento de dados, limites de conexão, invalidação de cache, falhas parciais e recuperação.
- Cache nunca é fonte de verdade para dado de negócio sem decisão arquitetural explícita (owner, TTL, invalidação, limite de memória, eviction, comportamento em indisponibilidade).
- Índices e otimização de SQL exigem evidência de workload (`pg_stat_statements`, estatísticas, `EXPLAIN`). Evitar índice especulativo que amplie custo de escrita.
- Dimensionar pools pelo orçamento total do banco (`réplicas × processos × pools por processo`), reservando conexões operacionais. **Proibido criar instâncias Sequelize ad hoc em serviços.**
- Evitar SQL bruto; quando inevitável, usar bind parameters. Migration destrutiva exige backup verificável e rollback.
- Não otimizar só a média: registrar p95/p99, erros, saturação e recuperação.

## Ambiente

- `claudeuser` está no grupo `docker`. Se o grupo ainda não valeu na sessão, usar `sg docker -c "comando"`.
- Arquivos do repo pertencem a `root`. Em "permission denied" ao editar, trocar o dono do arquivo específico (`sudo chown claudeuser:claudeuser <arquivo>`) — nunca recursivo no repo inteiro.
- Push via `credential.helper store --file=~/.git-credentials-konnex` (0600, fora do repo). Não há `gh` instalado.
- Portas: 8090 frontend, 3007 API; postgres/redis só na rede interna do Docker.

## Referência externa

`/root/reference-crms/` tem clones de CRMs concorrentes (wacrm, DeskcommCRM, ticketz, whaticket-community, chatwoot) **somente para consulta de padrões** — nunca copiar código sem verificar licença, nunca importar como dependência.
