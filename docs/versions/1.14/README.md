# Whitelabel Whaticket — versão 1.14

Data: 2026-07-29  
Estado: publicada

## Objetivo

Eliminar buscas ativas de mensagens WhatsApp/Facebook por `wid` sem tenant.

## Escopo

- mensagens citadas WhatsApp usam `wid + companyId`;
- mensagens citadas Facebook usam `wid + companyId`;
- ACK direto e enfileirado transporta e valida `companyId`;
- marcação de mensagem apagada mantém `companyId` no segundo lookup;
- regressão garante propagação do tenant pelo job de ACK.

## Evidência estática

A busca por `Message.findOne/findAll` com `wid` nos arquivos ativos foi
repetida após a alteração. Todas as ocorrências encontradas possuem
`companyId`; o arquivo legado `wbotMessageListener-dontwork.ts` não é carregado
e permanece como dívida de remoção.

## Evidência de entrega

- quality gate aprovado com 13 suítes e 48 testes;
- backend e frontend compilados em imagens Docker reproduzíveis;
- API respondeu `1.14` e frontend permaneceu ativo no smoke;
- smoke reaprovado após restart real;
- shutdown por `SIGTERM` fechou recursos em 4 ms;
- nenhuma migration pendente no startup.

## Limites

- outros modelos ainda exigem auditoria equivalente;
- o payload de jobs não é ainda validado por schema;
- a transação Message ainda não engloba Ticket/Contact/fence.
- frontend mantém 105 alertas npm e bundle principal de 1,68 MB; a correção
  exige atualização controlada, não `audit fix --force`.
