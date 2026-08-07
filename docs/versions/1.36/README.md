# Versão 1.36 — instalador de um comando

Data: 2026-08-08
Estado: verificado por instalação completa numa cópia isolada

## Por que

A instalação manual pedia 41 variáveis de ambiente, dez delas segredos
criptográficos que o comprador teria que gerar sozinho. Esse é o ponto onde uma
venda de código-fonte perde o cliente — e onde o suporte morre.

## O que faz

`./instalar.sh` pergunta quatro coisas: domínio do painel, domínio da API,
e-mail e senha do administrador. Todo o resto é gerado.

1. **Confere o servidor** — Docker, Compose v2, permissão, memória, disco e as
   portas 8090/3007 livres. Falha aqui é falha antes de estragar qualquer coisa.
2. **Gera a configuração** — dez segredos de 64 caracteres, `.env` com permissão
   `600` e um `Caddyfile` para HTTPS automático. Nenhum segredo é digitado.
3. **Sobe** — `docker compose up --build -d`, com `RUN_DB_SEEDS=true` para criar
   empresa, plano, usuário e settings iniciais.
4. **Verifica de verdade** — versão da API, banco e Redis conectados, painel
   respondendo e **login do administrador funcionando**.

Ao final imprime a senha (quando gerada) e os dois passos que dependem de DNS:
apontar os domínios e ativar o Caddy.

## O defeito que o teste encontrou

Na primeira execução completa o instalador terminou dizendo **"CRM instalado"**
com o banco vazio: 0 empresas, 0 planos, 0 usuários. Ninguém conseguiria entrar.

Causa: `export RUN_DB_SEEDS=true` no shell não chegava ao container, porque
`compose.yaml` não declarava essa variável no bloco `environment` do backend. O
entrypoint lia `${RUN_DB_SEEDS:-false}` e pulava os seeds.

Nada nisso era visível pela leitura do código. Só apareceu executando.

**Correções:**
- `compose.yaml` passa `RUN_DB_SEEDS: ${RUN_DB_SEEDS:-false}` ao backend;
- o instalador termina fazendo um **login real** e falha se ele não funcionar.
  "Instalado" passou a ser afirmação provada, não impressão;
- as cores foram definidas com `$'...'` — no primeiro teste os marcadores de
  negrito saíam literais (`\033[1m`) no texto final que o comprador lê.

## Evidência

Instalação completa numa cópia isolada, em portas próprias (8190/3107), com
volumes novos:

```
✓ 10 segredos gerados — nenhum digitado à mão
✓ Caddyfile criado (HTTPS automático)
✓ Todos os serviços saudáveis
✓ API respondendo — versão 1.35
✓ Banco e Redis conectados
✓ Painel respondendo
✓ Login do administrador funciona
```

Verificado de fora, sem confiar na autoavaliação do script: banco com
1 empresa / 1 plano / 1 usuário / 18 settings, login independente aprovado, e a
instalação nova já nasce com as proteções das versões 1.33–1.35 —
`/dashboard/ticketsUsers` sem token responde 401, `/users/list` sem token
responde 401, e o que o plano libera responde 200.

## Limites honestos

- DNS e Caddy continuam manuais: dependem de acesso ao registrador do domínio,
  que o instalador não tem.
- Testado em Ubuntu com Docker já instalado. Não foi testado em VPS zerada, nem
  em outras distribuições.
- Não instala o Caddy — gera o arquivo e mostra os três comandos.
- Sem SMTP configurado, "esqueci minha senha" e convite de usuário continuam sem
  funcionar. O `.env` gerado deixa os campos prontos e comentados.

## Rollback

Aditivo. `instalar.sh` é novo; a única mudança em arquivo existente é a linha
`RUN_DB_SEEDS` no `compose.yaml`, cujo padrão (`false`) preserva o
comportamento anterior.
