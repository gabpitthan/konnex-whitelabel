# Instruções permanentes — Whitelabel Whaticket

Antes de qualquer alteração:

1. Ler `PROJECT_STATE.md`, `VERSION`, `CHANGELOG.md` e `docs/VERSIONING.md`.
2. Verificar `git status` e preservar alterações existentes.
3. Tratar este projeto como uma plataforma multiempresa: toda leitura e mutação de dados de tenant deve incluir `companyId`.
4. Não modificar nem reiniciar outros projetos do servidor.

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
