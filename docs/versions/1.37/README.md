# Versão 1.37 — a instalação nova não funcionava nos dez primeiros minutos

Data: 2026-08-08
Estado: implantada e verificada em produção
Origem: uso real, não auditoria. Gabriel mandou uma mensagem para o número
conectado e tropeçou em três defeitos seguidos.

Nenhum é bug de lógica. Os três são **padrões de primeira instalação** que
tornam o produto inutilizável para quem acabou de instalá-lo — exatamente o
comprador do código-fonte.

## 1. A mensagem chegava e o ticket ficava invisível

Mensagem recebida às 06:18 criou o ticket 3 (`pending`, `queueId` nulo,
1 não lida). O dashboard contabilizou. A lista "Aguardando atendimento" ficou
vazia.

`ListTicketsService` monta:

```ts
queueId: showTicketWithoutQueue ? { [Op.or]: [queueIds, null] } : { [Op.or]: [queueIds] }
```

com `showTicketWithoutQueue = user.allTicket === "enable"`.

Toda empresa nova nasce com `allTicket = "disable"`, e uma instalação recém-feita
não tem fila nenhuma. Com `queueIds` vazio, o filtro virava `queueId IN ()` e não
casava com **nada** — nem os tickets sem fila, nem qualquer outro. Mensagem
entrando, painel contando, ninguém atendendo.

**Correção:** ticket sem fila passa a ser alcançável quando o usuário é `admin`
(quem administra a conta não pode perder mensagem por uma configuração que
desconhece) ou quando não tem nenhuma fila atribuída (a alternativa é uma tela
permanentemente vazia). Quem tem fila continua vendo apenas as suas.

## 2. Aceitar pedia um setor que não existia

Com o ticket visível, aceitar abria o `AcceptTicketWithoutQueueModal` pedindo
"Selecionar setor" — com a lista vazia.

Aqui não havia defeito de código: faltava configuração que nada indica ser
necessária. São **três** vínculos e só o primeiro é óbvio:

| Vínculo | Onde | Efeito de faltar |
|---|---|---|
| Criar a fila | Administração → Filas | seletor vazio |
| **Conexão → fila** | Conexões → editar | ticket nasce sem setor, e o modal aparece |
| Usuário → fila | Administração → Equipe | não recebe distribuição |

O que faltava era o segundo. Registrado como pendência de produto: a instalação
deve criar a fila padrão e vincular conexão e admin automaticamente.

Nota de usabilidade: o mesmo cadastro se chama **Filas** no menu, **Setor** no
modal de transferência, **Setor/Fila** na tabela e **Selecionar setor** no aceite.
O dono do produto levou tempo procurando onde configurar "setor".

## 3. Aceitar enviava uma mensagem vazia ao cliente

`Messages` id 7: `fromMe`, **zero caractere**, enviada de verdade ao contato.

Causa: `sendGreetingAccepted` nasce `enabled` em toda empresa nova e
`greetingAcceptedMessage` nasce vazia. Ao aceitar, o front dispara a saudação —
que não existe — e o backend aceitava a string vazia.

**Correção em três camadas:**

1. `MessageController.store` recusa mensagem sem texto, sem mídia e sem vCard,
   com `400` e mensagem que explica a origem provável. Ficou no controller, não
   na tela, porque o mesmo caminho serve saudação, chatbot, campanhas e API
   externa — corrigir só o botão deixaria as outras portas abertas;
2. o front não dispara saudação em branco. Não ter saudação é normal; mandar o
   vazio é que não;
3. o padrão passa a ser `disabled` em `CreateCompanyService` e nos dois seeds.
   Ligar uma saudação sem texto é uma armadilha embutida na instalação.

### Evidência

Empresa de teste com ticket próprio, contra a API em produção:

```
corpo vazio      -> 400  "Não é possível enviar uma mensagem vazia..."
só espaços       -> 400
com texto        -> passa da guarda (para em ERR_NO_DEF_WAPP_FOUND, esperado)
empresa nova     -> sendGreetingAccepted = disabled
```

## De quebra: a prova de produção da 1.32

A mensagem das 06:18 caiu no **contato 1** (`558896090796`, telefone real) e não
criou um quarto contato LID. É a prova que faltava desde 2026-08-07 e que só o
tráfego real poderia dar: a resolução de LID funciona em produção.

## Aplicado à produção

Além do código: fila "Atendimento" vinculada à conexão "Teste" e aos dois
usuários, e `sendGreetingAccepted` desligada (estava ligada com texto vazio).

## Limites honestos

- Os três vínculos de fila continuam manuais para quem instala. O próximo lote
  leva isso para o instalador.
- A inconsistência de nome (Filas / Setor / Departamento) não foi corrigida.
- A guarda de mensagem vazia cobre o caminho de `MessageController.store`.
  Outros caminhos de envio (campanha, chatbot) usam serviços próprios e não
  foram auditados neste lote.

## Rollback

Imagem anterior. Sem migration. Os padrões de seed afetam apenas empresas
criadas depois; empresas existentes mantêm a configuração atual.
