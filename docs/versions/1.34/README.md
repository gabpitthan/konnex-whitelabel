# Versão 1.34 — SEC-001: isolamento multiempresa provado com duas empresas reais

Data: 2026-08-07
Estado: implantada e verificada em produção
Classe de risco: P0 — isolamento multi-tenant

## Por que este lote

SEC-001 estava aberto desde o início do projeto: **o isolamento entre empresas
nunca tinha sido testado**, porque a produção sempre teve uma única empresa.
Vender um CRM whitelabel multiempresa sem esse teste é vender uma promessa não
verificada.

O teste foi feito de verdade: duas empresas novas (`QA Isolamento B` e
`QA Isolamento D`), criadas pela API de administração, uma tentando ler, alterar
e apagar os dados da outra.

## O que o teste encontrou

Leitura estava protegida em 20 superfícies. **Escrita e exclusão não.**

| Ataque | Antes |
|---|---|
| `DELETE /tickets/1` (empresa A) | **200 — apagou o ticket e as mensagens por cascata** |
| `GET /quick-messages/:id` | 200 — vazou a mensagem de outra empresa |
| `DELETE /quick-messages/:id` | **200 — apagou** |
| `GET /contact-lists/:id` | 200 — vazou |
| `PUT /contact-lists/:id` | **200 — alterou o nome para "INVADIDO"** |
| `DELETE /contact-lists/:id` | **200 — apagou** |

Todas as rotas exigiam autenticação. Todos os controllers tinham o `companyId`
do token em mãos. O defeito estava uma camada abaixo: **os serviços buscavam o
registro só por ID** (`findByPk(id)`), e o `companyId` ou não era passado, ou
chegava e não era usado.

O caso mais claro foi `DeleteTicketService`: recebia `companyId` como parâmetro
e nunca o usava; no controller havia um `ShowTicketService(ticketId, companyId)`
comentado — a verificação de tenant existiu e foi desativada em algum momento.

## Custo real do teste

Provar exclusão indevida **destrói o dado**. O ticket 1 da empresa de produção,
com o histórico de mensagens, foi apagado durante a prova e não foi recuperado.
Era dado de teste (contato do E2E), não de cliente.

Por isso o teste definitivo (`isolamento-completo.sh`) passou a criar uma
empresa-alvo descartável: a empresa de produção não é mais usada como alvo.

## Mudança

Escopo de tenant aplicado na consulta — não numa verificação separada que pode
ser comentada:

- `TicketServices/DeleteTicketService`
- `QuickMessageService`: Show, Update, Delete
- `ContactListService`: Show, Update, Delete
- `ContactListItemService`: Show, Delete
- `TagServices`: Show, Update, Delete
- `ChatService`: Show, Update, Delete
- `QueueOptionService`: Show, Update, Delete — escopado pela `Queue` da empresa,
  via `include` obrigatório, já que `QueueOption` não tem `companyId` próprio
- `ScheduledMessagesService` e `ScheduledMessagesEnvioService`: Show, Update

Os controllers correspondentes passaram a repassar `req.user.companyId`. O
compilador foi usado como rede: mudar a assinatura do serviço fez o TypeScript
apontar todos os chamadores que faltavam.

## Regressão

`routes/__tests__/tenantAuthContract.spec.ts` ganhou uma quarta asserção:
**todo serviço `ShowService`/`UpdateService`/`DeleteService` precisa mencionar
`companyId`**, com exceção declarada para os três de conteúdo de plataforma
(`Announcement`, `Help`, `Partner`), que são compartilhados por decisão de
produto.

É uma verificação grosseira de propósito: ela não prova que o escopo está
correto, mas torna impossível criar um serviço novo **sem** escopo sem que
alguém decida isso explicitamente. Junto com o teste de ataque real, cobre os
dois lados — o estático pega a omissão, o dinâmico pega o engano.

## Evidência

Antes: 6 ataques bem-sucedidos, incluindo três exclusões.
Depois, os mesmos ataques, mesmas empresas:

```
ler msg rapida de C      -> HTTP 404 negado
alterar msg rapida de C  -> HTTP 404 ERR_NO_QUICKMESSAGE_FOUND
apagar msg rapida de C   -> HTTP 404 ERR_NO_QUICKMESSAGE_FOUND
ler lista de C           -> HTTP 404 negado
alterar lista de C       -> HTTP 404 ERR_NO_CONTACTLIST_FOUND
apagar lista de C        -> HTTP 404 ERR_NO_CONTACTLIST_FOUND
recurso de C intacto     -> OK
```

`DELETE /tickets/2` pela empresa B: `404 ERR_NO_TICKET_FOUND`, ticket preservado
no banco.

Gate: 62 suítes / 237 testes. `tsc --noEmit` limpo.

## Limites honestos

- Contato, tag e fila **não** foram exercitados neste ataque: a empresa-alvo não
  conseguiu criá-los pelo payload usado. O código dessas superfícies foi
  corrigido e o contrato estático as cobre, mas o ataque real não.
- O escopo de `QueueOption` depende do `include` obrigatório da `Queue`. Se
  alguém tornar esse include opcional, o escopo cai sem quebrar teste.
- Só o método `ShowService`/`UpdateService`/`DeleteService` foi varrido. Serviços
  com outros nomes que busquem por ID continuam não auditados — a varredura
  estática apontou 106 consultas suspeitas no total, a maioria falso positivo,
  mas não todas.

## Rollback

Imagem anterior. Sem migration, sem mudança de esquema, índice, cache ou dado.
