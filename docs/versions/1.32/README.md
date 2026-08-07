# Versão 1.32 — identidade de contato quando o WhatsApp entrega LID

Data: 2026-08-07
Estado: em validação de produção

## Problema comprovado

O WhatsApp entrega o remetente como LID (`<id>@lid`) quando a conta usa o
identificador de privacidade. O LID não é um telefone: gravado no campo `number`
do contato, ele nunca deduplica com a base importada e quebra campanha,
relatório e integração externa.

Em produção a mesma pessoa virou dois contatos com tickets separados:

| id | name | number | remoteJid |
|---|---|---|---|
| 1 | Gabriel (teste E2E) | 558896090796 | `558896090796@s.whatsapp.net` |
| 2 | Gabriel Pitthan | 210986577449008 | `210986577449008@lid` |

É bloqueador de venda, não dívida técnica: em escala, todo contato que escreve
para o CRM entra sem telefone utilizável.

## Por que o lote precisou de duas partes

A primeira correção cobriu apenas o caminho da mensagem (`getContactMessage` e
`getSenderMessage`). Ela foi implantada em 2026-08-07 às 00:47 — e às 06:54, com
ela no ar, a produção criou um terceiro contato LID:

```
id 3 | name 100236483629289 | number 100236483629289 | remoteJid 100236483629289@lid
```

Sem ticket e sem mensagem associada, ou seja, por outro caminho. A causa é o
handler `contacts.update` do listener: ele criava contato a partir de qualquer
evento de troca de foto de perfil, com `name` e `number` iguais aos dígitos do
JID.

Esse achado é a razão de o lote não ter sido fechado antes com "correção
implantada": a prova em produção mostrou que ela não bastava.

## Mudança

Caminho da mensagem — resolve o telefone real a partir da própria chave:

- `helpers/ResolveContactJid.ts` prefere `key.senderPn` / `key.participantPn` e
  só cai para o LID quando o mapeamento não veio;
- integrado em `getContactMessage` e `getSenderMessage`.

Caminhos que só recebem o JID, sem mapeamento possível:

- `contacts.update` deixa de criar contato e passa a só atualizar a foto de
  quem já existe no tenant, via `FindWhatsappContactByJidService`. Trocar a foto
  de perfil não é motivo para criar contato — o handler inventava registro para
  quem nunca falou com o CRM, com nome numérico;
- `verifyRecentCampaign` resolve o remetente antes de casar a confirmação de
  campanha, e ignora LID não resolvido. Com os dígitos do LID a confirmação
  nunca casava e a campanha travava sem erro visível;
- `typebotListener` resolve antes de montar `${number}@c.us`. Com LID, a
  resposta do bot saía endereçada a um número que não existe.

`FindWhatsappContactByJidService` procura por `remoteJid` antes de `number` de
propósito: um LID é uma sequência de dígitos como qualquer outra, e procurá-lo
em `number` casaria com o telefone homônimo de outro contato.

## A correção não exige Baileys 7

O 6.7.22 já entrega o telefone real em `key.senderPn` / `key.participantPn` —
campos oficiais e tipados em `lib/Types/Message.d.ts`, preenchidos a partir de
`stanza.attrs.sender_pn` em `lib/Utils/decode-wa-message.js`. Isso reclassifica
o ISSUE WA-003 de "P2, esperar v7" para bloqueador resolvido por leitura de
campo.

O que o 6.7.22 **não** tem é um armazenamento de mapeamento LID↔telefone
(`lidMapping`), confirmado por busca no pacote instalado. Por isso os caminhos
que recebem só o JID não podem resolver nada, e a decisão correta neles é não
criar identidade — não inventá-la.

## Limites e riscos aceitos

- `ResolveContactJid` não importa o Baileys: o pacote é ESM e derruba o Jest, e
  contornar com `jest.mock` faria o teste provar o mock. `isLidJid` e
  `normalizeJid` espelham `lib/WABinary/jid-utils.js`. Risco aceito: divergir se
  o formato de JID mudar.
- Sem migration de merge para os LIDs já gravados. Mesclar contatos
  automaticamente é arriscado e não há base acumulada. Fica registrado para
  quando houver.
- Grupos continuam usando o id do grupo como número; fora deste lote.
- `ImportContactsService` (importação da agenda do telefone) ainda deriva número
  do id da lista. Não foi exercitado em produção e fica registrado em ISSUES.

## Evidências

- causa do contato #3 identificada no código e confirmada pelo formato do
  registro gravado (`name` = `number` = dígitos do JID);
- `Socket/messages-recv.js:333` do Baileys instalado confirma que
  `contacts.update` de foto emite apenas `{ id, imgUrl }`;
- 16 testes aprovados em `ResolveContactJid.spec.ts` e
  `FindWhatsappContactByJidService.spec.ts`;
- `tsc --noEmit` do backend limpo;
- ambos os specs incluídos em `scripts/quality-gate.sh`.

## Rollback

Imagem anterior. Não há migration, alteração de schema, índice, cache ou dado.
