# Instruções permanentes — Whitelabel Whaticket

Antes de qualquer alteração:

1. Ler `PROJECT_STATE.md`, `docs/project/CURRENT.md`, `docs/project/ROADMAP.md`, `VERSION`, `CHANGELOG.md` e `docs/VERSIONING.md`.
2. Verificar `git status` e preservar alterações existentes.
3. Tratar este projeto como uma plataforma multiempresa: toda leitura e mutação de dados de tenant deve incluir `companyId`.
4. Não modificar nem reiniciar outros projetos do servidor.
5. Registrar a tarefa atual em `tasks/ACTIVE.md` quando houver implementação.

## Operação autônoma

- Interpretar prompts simples e descobrir sozinho os componentes, rotas, banco, riscos e testes envolvidos.
- Para tarefas grandes, usar subagentes com escopos independentes: engenharia, QA, segurança/multitenancy, operações ou UX. O agente principal sempre integra e valida.
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
