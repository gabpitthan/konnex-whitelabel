# Versão 1.33 — fechamento de vazamento entre empresas

Data: 2026-08-07
Estado: implantada e verificada em produção
Classe de risco: P0 — falha de autenticação e isolamento multiempresa

## Problema comprovado

Duas rotas de relatório do dashboard estavam **sem middleware de autenticação**.
O `isAuth` estava importado no arquivo e aplicado nas outras duas rotas do mesmo
router — foi omitido só nestas:

```ts
routes.get("/dashboard", isAuth, DashboardController.index);
routes.get("/dashboard/ticketsUsers", DashboardController.reportsUsers);   // sem isAuth
routes.get("/dashboard/ticketsDay", DashboardController.reportsDay);       // sem isAuth
routes.get("/dashboard/moments", isAuth, DashboardController.DashTicketsQueues);
```

Somado a `companyId` lido de `req.query`, o resultado era leitura de dados de
qualquer empresa **sem token nenhum**. Provado contra a produção antes da
correção:

```
$ curl "https://api-whitelabel.usekonnex.com/dashboard/ticketsUsers?companyId=1&initialDate=2026-01-01&finalDate=2026-12-31"
HTTP 200
{"data":[{"quantidade":"1","nome":"Admin"},{"quantidade":0,"nome":"QA descartavel"}]}

$ curl ".../dashboard/ticketsDay?companyId=1&..."
HTTP 200
{"count":2,"data":[{"total":"2","data":"06/08/2026"}]}
```

Qualquer pessoa na internet podia varrer `companyId=1,2,3…` e obter nome dos
usuários e volume de atendimento de todos os clientes da plataforma. Em produto
whitelabel vendido para vários clientes, isso é vazamento de um cliente para
outro e para terceiros.

## Mudança

**Rotas sem autenticação:**
- `/dashboard/ticketsUsers` e `/dashboard/ticketsDay` passam a exigir `isAuth`;
- `/invoices/list` passa a exigir `isAuth` (respondia 500 por falta de sessão —
  não vazava, mas estava aberta e quebraria em vazamento na primeira alteração
  que tratasse o erro).

**Tenant vindo do cliente:**
- `DashbardController.reportsUsers` / `reportsDay` leem `companyId` de
  `req.user`, não de `req.query`;
- `UserController.list` idem — `GET /users/list?companyId=N` devolvia nome,
  e-mail e filas dos usuários de qualquer empresa para qualquer usuário logado.

**Chave-mestra da API externa:**
- `/api/contacts`, `/api/contacts-count` e `/api/messagesRange` saíram do
  `isAuthCompany` — que valida um único `COMPANY_TOKEN` global do ambiente e
  deixava o chamador escolher a empresa no corpo/query — e passaram a usar
  `tokenAuth`, a credencial por empresa, revogável, já existente desde a 1.20.
  Com o token global, um único segredo vazado exporia a base de contatos e o
  histórico de mensagens de **todos** os clientes.

## Regressão

`src/routes/__tests__/tenantAuthContract.spec.ts`, incluído no
`scripts/quality-gate.sh`. Cobre a **classe**, não as instâncias:

1. varre todos os arquivos de rota, extrai cada declaração (inclusive
   multi-linha) e exige middleware de autenticação em todas — com uma lista
   explícita de rotas públicas por design, de modo que abrir uma rota nova passe
   a ser decisão registrada e não omissão silenciosa;
2. exige `isAuth` em todas as rotas do dashboard;
3. proíbe qualquer controller de ler `companyId` de `req.query` ou `req.body`.

O motivo de o teste ser declarativo: uma rota nova sem autenticação **não quebra
nada e não gera erro** — ela simplesmente responde. Só um contrato que reprova
por ausência pega isso.

## Evidência

Antes: os quatro endpoints respondiam 200 (três com dados, um com 500).
Depois, as mesmas requisições, sem alterar nada além do deploy:

```
HTTP 401  /dashboard/ticketsUsers?...&companyId=1
HTTP 401  /dashboard/ticketsDay?...&companyId=1
HTTP 401  /users/list?companyId=1
HTTP 401  /invoices/list
HTTP 401  /api/contacts  (com o COMPANY_TOKEN global)
```

`/version` → 1.33, `/health/ready` → 200, container saudável.

## Limite honesto desta versão

A correção do `UserController.list` está provada por leitura de código e pelo
contrato estático, **não** por teste de runtime entre dois tenants: existe uma
única empresa em produção. O teste negativo real — usuário da empresa B tentando
ler dados da empresa A e recebendo negativa — continua pendente e é o item
SEC-001. Esta versão reduz a superfície; não fecha o SEC-001.

## Rollback

Imagem anterior. Sem migration, sem mudança de esquema, índice, cache ou dado.
