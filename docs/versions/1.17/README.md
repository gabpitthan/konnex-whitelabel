# Whitelabel Whaticket — versão 1.17

Data: 2026-07-29  
Estado: publicada

## Objetivo

Vincular cada request da API externa ao tenant/conexão autenticados pelo Bearer
token e tornar a contabilização concorrente segura.

## Fontes

- OWASP API1/BOLA:
  https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
- OWASP REST Security:
  https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- RFC 6750:
  https://www.rfc-editor.org/rfc/rfc6750
- PostgreSQL INSERT:
  https://www.postgresql.org/docs/current/sql-insert.html

## Entregue

- Bearer token é analisado estritamente e resolvido uma única vez no middleware;
- request recebe somente `whatsappId`, `companyId` e `channel` autenticados;
- payload não pode trocar a conexão e `companyId` não é confiado do cliente;
- controllers consultam a conexão por `id + companyId + channel`;
- token não vazio é globalmente único no PostgreSQL;
- criação e atualização validam colisão, com índice fechando a corrida;
- consumo diário é único por tenant/data e usa um UPSERT atômico aguardado;
- envio sem mídia é contabilizado como texto, não como mídia vazia.

## Evidência

- backup `pre-1.17-20260729.dump`, modo 600, SHA-256
  `117917baeb8efe86a66259a6f1fe3f1257b466f404632e474c26082d7930c863`;
- restore real com 57 tabelas;
- migration no restore: up 39 ms, down 31 ms, segundo up 56 ms;
- produção: migration em 113 ms;
- 21 suítes e 81 testes aprovados;
- builds backend/frontend aprovados;
- API expôs 1.17; ausência de Bearer retornou 401;
- restart recebeu SIGTERM e fechou recursos em 2 ms.

## Limitações

- tokens continuam armazenados como valor recuperável para preservar clientes;
- rotação dual, digest/prefixo e revogação auditável permanecem próximos;
- rate limiting ainda não é individual por credencial;
- nenhum envio real foi realizado sem uma conta canário isolada;
- frontend não mudou; bundle e dependências legadas permanecem no baseline.
