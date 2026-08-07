# Instruções permanentes — Whitelabel Whaticket

Antes de qualquer alteração:

1. Ler `PROJECT_STATE.md`, `docs/project/CURRENT.md`, `docs/project/ROADMAP.md`, `VERSION`, `CHANGELOG.md` e `docs/VERSIONING.md`.
2. Verificar `git status` e preservar alterações existentes.
3. Tratar este projeto como uma plataforma multiempresa: toda leitura e mutação de dados de tenant deve incluir `companyId`.
4. Não modificar nem reiniciar outros projetos do servidor.
5. Registrar a tarefa atual em `tasks/ACTIVE.md` quando houver implementação.
6. Aplicar o ENGINEERING OS em `.engineering/jarvis/` (ver o JARVIS BOOT no fim deste arquivo e a precedência em `CLAUDE.md`). `docs/JARVIS_ENGINEERING_SYSTEM.md` continua como detalhe operacional do projeto, mas não é mais a autoridade em divergência.

## Operação autônoma

- Interpretar prompts simples e descobrir sozinho os componentes, rotas, banco, riscos e testes envolvidos.
- Para tarefas grandes, a topologia (SOLO / ASSISTED / SWARM) é decidida pelo ENGINEERING OS via `modules/orchestration.md`, não por uma lista fixa de subagentes — os antigos foram isolados em 2026-08-07. Os papéis continuam existindo como funções (engenharia, QA, segurança/multitenancy, operações, UX) em `runtime/ROLE_REGISTRY.md`; auditores permanecem somente-leitura na primeira passagem. O orquestrador sempre integra e valida.
- Trabalhar em ciclos finitos: reproduzir → diagnosticar → corrigir → testar → revisar. Após três tentativas sem progresso, documentar evidências e o bloqueio real.
- Não pedir ao usuário decisões técnicas rotineiras que possam ser determinadas pelo código e pela arquitetura.
- Não ampliar o escopo para ações externas irreversíveis, dados reais de clientes ou outros projetos.
- Antes de editar, concluir a auditoria solicitada; depois implementar o menor lote coerente.

## Encerramento obrigatório

1. Executar `scripts/preflight.sh`.
2. Executar testes proporcionais ao risco e `scripts/quality-gate.sh` quando houver código.
3. Em deploy, executar `scripts/smoke-test.sh`.
4. Fazer autoavaliação usando `docs/DEFINITION_OF_DONE.md`.
5. Atualizar `tasks/ACTIVE.md`, `docs/project/CURRENT.md`, `docs/project/ISSUES.md`, README da subversão e changelog.
6. Confirmar persistência, refresh/restart, backend, mobile e isolamento por tenant quando aplicável.
7. Registrar limitações; nunca chamar uma interface não funcional de concluída.
8. Pontuar a autoavaliação 0–2 e bloquear conclusão se corretude, dados, auth/tenant, runtime ou rollback tiverem nota 0.
9. Registrar “Como esta entrega ainda pode falhar?” e separar fatos, inferências e itens não testados.

## Profundidade mínima obrigatória

- Não resolver pedidos amplos com mudanças cosméticas ou uma única camada transversal.
- Para redesign, auditar e migrar também a composição interna, hierarquia, estados e fluxo das funcionalidades.
- Antes do deploy executar três revisões independentes:
  1. **funcional:** dados, APIs, permissões, persistência e erros;
  2. **UX:** clareza, sequência, ações, scroll, mobile e identidade;
  3. **regressão:** login autenticado, console, rede, refresh, rotas e estados críticos.
- Build e HTTP 200 não provam que o frontend funciona.
- Toda mudança de shell ou rota autenticada exige navegador autenticado real, captura de console e screenshot desktop/mobile.
- Toda proteção de erro exige teste induzido do fallback e confirmação de que o erro chegou à observabilidade.
- Comparar a entrega com o pedido original e listar internamente o que ainda ficou superficial.
- Se uma funcionalidade apenas herdou tokens/tema, descrevê-la como pendente, não reformulada.

## Versionamento obrigatório

- A versão ativa está no arquivo `VERSION`.
- Cada lote de alterações funcionais deve incrementar exatamente uma subversão antes do commit: `1.1` → `1.2` → `1.3`.
- Não incrementar a versão por simples leitura, diagnóstico sem mudança ou atualização apenas da memória.
- O número principal só muda após o usuário declarar que a versão atual está pronta. Depois do snapshot, o próximo ciclo começa em `2.1`, `3.1` e assim por diante.
- Toda subversão precisa de entrada em `CHANGELOG.md` contendo objetivo, alterações, migrations, testes, limitações e commit.
- Toda subversão precisa de um README próprio em `docs/versions/X.Y/README.md`.
- A versão exibida no frontend, o endpoint `/version`, os `package.json` e o arquivo `VERSION` devem permanecer sincronizados.
- Atualizar `PROJECT_STATE.md` em toda entrega relevante.

## Versão pronta

Quando o usuário disser que a versão está pronta:

1. Garantir worktree limpo e testes registrados.
2. Executar `scripts/create-version-snapshot.sh`.
3. Salvar em `/root/whitelabel-whaticket-versions/versao-X.Y/`.
4. Conferir arquivo fonte, manifesto, release notes e SHA-256.
5. Conferir que o `README.md` da versão foi copiado para o snapshot.
6. Nunca incluir `.env`, credenciais, tokens, banco de produção, certificados privados, logs, uploads de clientes ou `node_modules`.
7. Registrar o snapshot em `PROJECT_STATE.md` e `CHANGELOG.md`.

## Qualidade e segurança

- Não considerar funcionalidade concluída apenas porque compila ou renderiza.
- Validar persistência após refresh/restart quando aplicável.
- Adicionar testes para correções e novas funcionalidades.
- APIs multiempresa devem validar tenant no backend, nunca apenas no frontend.
- Evitar SQL bruto; quando inevitável, usar replacements/bind parameters.
- Não inserir segredos, chaves, senhas ou dados pessoais no Git, documentação ou logs.
- Realizar deploy somente com build aprovado e teste de regressão de login, API e serviços críticos.
- Não ler, imprimir ou copiar `credentials.txt` ou `.env`; scripts podem consumir variáveis sem exibi-las.
- Migrations destrutivas exigem backup verificável e plano de rollback.

## Pesquisa, escala e produção

- Antes de decisões sobre arquitetura, banco, cache, filas, segurança,
  dependências ou infraestrutura, pesquisar profundamente documentação primária,
  casos upstream e limitações conhecidas. Pesquisa superficial não autoriza
  mudança de produção.
- Auditar também o que já foi implementado. Se a evidência contrariar uma
  decisão existente, planejar e executar a menor correção segura, reversível e
  testável.
- Toda mudança deve considerar simultaneamente: escala horizontal, latência,
  throughput, backpressure, integridade transacional, isolamento por tenant,
  cardinalidade, crescimento de dados, limites de conexão, cache invalidation,
  falhas parciais e recuperação.
- Cache nunca é fonte de verdade para dados de negócio sem uma decisão
  arquitetural explícita. Definir owner, TTL, invalidação, limite de memória,
  política de eviction e comportamento em indisponibilidade.
- Índices e otimizações de SQL exigem evidência de workload/plano
  (`pg_stat_statements`, estatísticas e `EXPLAIN`) ou padrão de consulta
  comprovado. Evitar índices especulativos que ampliem custo de escrita.
- Dimensionar pools pelo orçamento total do banco:
  `réplicas × processos × pools por processo`, reservando conexões operacionais.
  É proibido criar instâncias Sequelize ad hoc em serviços.
- Não otimizar apenas média: registrar p95/p99, erros, saturação e recuperação.
- Registrar fontes, baseline, decisão, alternativas, rollout, rollback e “como
  ainda pode falhar” na memória persistente.
- Seguir continuamente `docs/project/ROADMAP.md` e o próximo passo de
  `docs/project/CURRENT.md`; ao concluir um lote, selecionar o próximo P0/P1
  baseado em risco e evidência.
- Manter commits pequenos por subversão e sincronizar o repositório remoto
  configurado. Nunca publicar `.env`, tokens, credenciais, bancos, uploads,
  certificados privados ou logs.
- Cada lote aprovado só termina após push para `main` de
  `gabpitthan/konnex-whitelabel` e verificação do SHA remoto. Este deve
  permanecer o único repositório público da conta salvo nova ordem explícita.

# JARVIS BOOT

Este repositório usa o ENGINEERING OS / JARVIS.

Antes de qualquer tarefa:

1. leia `.engineering/jarvis/JARVIS_CORE.md` por completo e execute o BOOT definido nele;
2. carregue `.engineering/jarvis/ENGINEERING_OS_INDEX.md`;
3. classifique a task T0–T4 e selecione módulos por `.engineering/jarvis/runtime/MODULE_ROUTER.md`;
4. para T2+, faça o lookup dirigido da Spec segundo `.engineering/jarvis/runtime/SPEC_LOOKUP_PROTOCOL.md` e preencha o Policy Coverage antes de mudança material;
5. decida SOLO / ASSISTED / SWARM conforme a topologia da task e as capabilities reais;
6. verifique o resultado real antes de declarar DONE.

Não duplique a política do ENGINEERING OS neste arquivo. Ele é bootloader.
