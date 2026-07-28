# Pesquisa de confiabilidade — Whaticket, Baileys e stack operacional

Data: 2026-07-28

## Conclusão executiva

O Whaticket original é útil como catálogo de sintomas, não como base de confiabilidade. O repositório é antigo, possui manutenção limitada e declara que o cliente não oficial do WhatsApp não é totalmente seguro.

Os maiores riscos do projeto atual são:

1. autenticação e isolamento do Socket.IO;
2. integridade do auth state e ciclo de vida do Baileys;
3. duplicidade de jobs e mensagens;
4. ausência de testes tenant A/B;
5. transações e SQL;
6. observabilidade das jornadas WhatsApp;
7. dependências sem suporte.

## Evidências no código local

### P0 — Socket.IO

- o access token contém `id: number` e `companyId: number`;
- `libs/socket.ts` exige `userId: UUID`;
- frontend conecta em `/${companyId}`, enquanto o backend aceita `/workspace-\d+`;
- `ticketId` também é validado como UUID, mas os models do Whaticket usam IDs numéricos;
- o namespace não é confrontado com o `companyId` assinado;
- `joinChatBox` entra na sala sem consultar ticket, empresa, fila ou permissão.

Impacto possível: eventos em tempo real rejeitados e risco cross-tenant. Exige teste real com dois tenants antes e depois.

### P0 — sessão WhatsApp

Pontos positivos:

- Baileys fixado em versão exata;
- backoff exponencial;
- limite de reconexões;
- `creds.update` persistido;
- `makeCacheableSignalKeyStore`;
- cache de retry.

Riscos:

- `new Promise(async ...)` com IIFE dificulta propagação de rejeição;
- timers/listeners não possuem cleanup central;
- inicializações concorrentes não têm single-flight;
- `fetchLatestBaileysVersion()` em cada início torna a compatibilidade variável;
- falhas Redis são engolidas e podem resultar em auth state parcial;
- auth keys não incluem `companyId` no namespace;
- códigos 403/405 apagam a sessão, embora 405 também apareça como incidente externo de pairing;
- estado `CONNECTED` do banco não prova socket saudável.

### P1 — filas

Bull oferece execução pelo menos uma vez. Lock expirado, processo bloqueado ou restart pode repetir job. Campanhas, mensagens e webhooks precisam:

- chave idempotente;
- constraint/deduplicação no banco;
- transação/outbox;
- retry com backoff e jitter;
- stalled/dead-letter observáveis;
- handler pequeno e reiniciável.

### P1 — banco

- existem queries interpoladas diretamente;
- operações ticket + mensagem + contador precisam de transação;
- eventos Socket.IO devem ocorrer somente após commit;
- índices devem começar pelo tenant quando o plano real justificar;
- migrations críticas precisam de transação, backup e rollback.

## Baileys 6 versus 7

O projeto usa `6.7.22`. A política oficial atual informa que versões anteriores à 7 não são mantidas.

A linha 7 inclui correções relevantes:

- deadlocks e race conditions;
- sessões fantasmas;
- reenvio e mensagens ausentes;
- vazamentos de memória;
- upload de mídia;
- app state;
- criptografia;
- LID/PN;
- CPU e batching.

Não atualizar diretamente. A versão 7 altera:

- CommonJS → ESM;
- LID como identidade principal;
- tipos de contato e MessageKey;
- auth state com `lid-mapping`, `device-list` e `tctoken`;
- protobuf;
- ACKs;
- formatos de pairing/QR.

Plano correto: laboratório separado → adapter de compatibilidade → replay → 1 sessão canário → soak 24–72 h → expansão gradual → rollback.

## Matriz WhatsApp obrigatória

### Conexão

- QR novo, expirado e renovado;
- pairing code;
- restartRequired;
- logout real;
- badSession;
- 401/403/405/408/428/440/515;
- queda de rede e DNS;
- restart backend, Redis e banco;
- credencial parcial/corrompida;
- duas inicializações simultâneas;
- 1, 10 e 50 sessões.

### Mensagens

- entrada e saída;
- duplicação de `messages.upsert`;
- reenvio/getMessage;
- ack e atualização;
- edição, exclusão e reação;
- LID, PN, grupo e Meta Ads;
- texto, áudio, imagem, vídeo e documento;
- 1 MB, 20 MB e limite configurado;
- filename malicioso, MIME falso e path traversal.

### Estabilidade

- soak 24–72 horas;
- tempestade de reconexão;
- RSS, heap, external e arrayBuffers;
- event-loop lag;
- idade da sessão;
- quantidade de listeners/timers;
- falhas e stalled jobs;
- 1.000 mensagens/minuto em ambiente isolado.

## Telemetria mínima

Por sessão:

- `companyId` pseudonimizado;
- `whatsappId`;
- estado lógico e estado real;
- disconnect code;
- tentativa e atraso de reconnect;
- session age;
- QR generation count;
- auth read/write failure;
- messages in/out/fail/retry/duplicate;
- media bytes/failure;
- memória e event-loop lag;
- versão Baileys e WA usada.

Nunca registrar auth state, QR completo, conteúdo de mensagem, telefone, token ou cookie.

## Fontes primárias

- Whaticket: https://github.com/canove/whaticket-community
- Whaticket conexão quebrada: https://github.com/canove/whaticket-community/issues/709
- Whaticket validação de grupos: https://github.com/canove/whaticket-community/issues/506
- Baileys releases: https://github.com/WhiskeySockets/Baileys/releases
- Baileys security: https://github.com/WhiskeySockets/Baileys/security
- Migração v7: https://baileys.wiki/docs/migration/to-v7.0.0/
- Conexão/auth: https://baileys.wiki/docs/socket/connecting/
- Configuração/getMessage/cache: https://baileys.wiki/docs/socket/configuration/
- Eventos: https://baileys.wiki/docs/socket/receiving-updates/
- Pairing 405: https://github.com/WhiskeySockets/Baileys/issues/2370
- Desconexões múltiplas: https://github.com/WhiskeySockets/Baileys/issues/1895
- Mensagens LID: https://github.com/WhiskeySockets/Baileys/issues/1964
- Bull: https://github.com/OptimalBits/bull
- BullMQ idempotência: https://docs.bullmq.io/patterns/idempotent-jobs
- Sequelize transações: https://sequelize.org/docs/v6/other-topics/transactions/
- Sequelize migrations: https://sequelize.org/docs/v6/other-topics/migrations/

