# Whitelabel Whaticket — versão 1.10

Data: 2026-07-29  
Estado: publicada
Commit funcional: `dde65fe`

## Objetivo

Preparar o lifecycle WhatsApp para reinícios previsíveis e remover o uso bloqueante de `KEYS` na limpeza Redis, sem fingir exclusividade distribuída antes de existir fencing real.

## Shutdown coordenado

- fases monotônicas `running`, `draining` e `closed`;
- novas inicializações WhatsApp retornam `APP_SHUTTING_DOWN` durante drain;
- timers de reconexão são cancelados;
- gerações das sessões ativas são invalidadas;
- listeners Baileys registrados neste módulo são removidos;
- WebSockets são fechados sem chamar logout e sem apagar credenciais;
- Socket.IO deixa de aceitar conexões e é encerrado;
- eventos de close durante drain não alteram status nem agendam reconexão;
- Docker concede 40 segundos, acima do timeout interno de 30 segundos.

## Redis

`CacheSingleton.delFromPattern` passou de `KEYS` + múltiplos `DEL` para:

- `SCAN` cursor-based;
- páginas limitadas;
- deduplicação por página;
- batches limitados;
- `UNLINK` assíncrono;
- até duas passagens para reduzir chaves perdidas durante mutação;
- propagação explícita de falhas.

## Segurança operacional

- modo cluster antigo foi bloqueado com erro claro;
- nenhum logout é executado em deploy/restart;
- nenhum auth state é removido no shutdown;
- nenhuma migration ou mudança de schema foi introduzida;
- lease/fencing distribuído continua explicitamente pendente.

## Qualidade

- 22 testes automatizados aprovados;
- backend TypeScript compilado;
- frontend de produção compilado;
- lint dos quatro arquivos novos aprovado;
- lint global reparado e executado, expondo 2.975 problemas legados;
- vulnerabilidades npm observadas: backend 95, frontend 105;
- gate runtime de restart e smoke registrado no relatório; canário WhatsApp e
  QA autenticado permanecem explicitamente fora da comprovação deste lote.

## Runtime publicado

- backend e frontend publicados em `1.10`;
- Node confirmado como processo principal do container;
- restart controlado recebeu `SIGTERM`;
- eventos `application_shutdown_started`,
  `application_shutdown_resources_closed` e
  `application_shutdown_completed` observados;
- cleanup monitorado concluído em 2 ms, dentro da janela Docker de 40 s;
- migrations permaneceram inalteradas;
- smoke pós-restart confirmou frontend e API.

## Limitações

- Bull, Sequelize e clientes Redis ainda não possuem encerramento explícito central;
- cleanup não usa ainda um registry universal de disposers;
- não existe lease distribuído nem fencing/CAS;
- Signal keys ainda não possuem manifesto/revision atômicos;
- frontend mantém bundle principal de 1,68 MB gzip e stack visual legada;
- pareamento, mídia e restart com conta canário ativa continuam pendentes.

## Próximo lote recomendado

Implementar exclusividade distribuída como um protocolo completo — lease, renovação, fencing token, CAS no banco, perda de ownership e reconciler — e não apenas como `SET NX PX`.
