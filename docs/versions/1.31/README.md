# Versão 1.31 — egress seguro do webhook

Data: 2026-08-03  
Estado: publicada

## Problema comprovado

O listener WhatsApp enviava mensagens a uma URL N8N/webhook configurável por
tenant usando `request` 2.88.2. Esse pacote está descontinuado, não possui
correção para sua cadeia vulnerável e era o único consumidor direto do projeto.
O caminho também escapava do egress endurecido entregue na 1.25: aceitava URL
sem validação de IP, redirects e respostas sem budget explícito.

O callback agravava a integridade operacional. O `try/catch` terminava antes da
resposta e um `throw` posterior não era convertido na Promise do listener; o
chamador podia perder a falha ou o processo podia receber exceção desacoplada.

## Mudança

- serviço pequeno e testável aguarda `externalRestrictedJsonClient.post`;
- a URL passa por validação de esquema/host e por lookup A/AAAA em cada socket;
- qualquer resposta DNS privada faz o request falhar fechado;
- proxy, socket path e redirects permanecem desativados;
- timeout é 15 s, corpo/resposta são limitados a 5 MiB;
- Agents keep-alive possuem no máximo 32 sockets e 4 ociosos;
- erros são propagados ao fluxo chamador, sem log de URL/payload;
- `request` e dependências exclusivas são removidos do lock/runtime.

## Escala e integridade

Reutilizar os Agents bounded evita conexão TCP/TLS nova por mensagem sem criar
um pool ilimitado. Não foi adicionado cache: o webhook é um efeito externo e
cachear resposta não preservaria semântica. Também não há retry automático,
pois timeout após envio é ambíguo e poderia duplicar uma automação N8N.

Não há mudança de schema, índices, Redis ou pool PostgreSQL. O rollback é a
imagem 1.30 e não exige reversão de dados.

## Evidências

- baseline `npm audit --omit=dev`: 72 achados, 7 críticos;
- resultado: 68 achados, 5 críticos;
- grafo anterior: `request` → `form-data` 2.3.3 + `tough-cookie` 2.5.0;
- três testes focados: contrato do POST, rejeição assíncrona e loopback bloqueado;
- build TypeScript aprovado;
- imagem runtime: 67 achados/4 críticos, somente `form-data` 4.0.6;
- gate completo: 59 suítes/217 testes e builds backend/frontend;
- produção: containers saudáveis, API/smoke 1.31 e zero migrations pendentes;
- restart: seis filas fechadas sem falha em 542 ms e retorno saudável.

## Fontes primárias

- descontinuação oficial do Request:
  <https://github.com/request/request/issues/3142>
- SSRF/cross-protocol redirect no Request:
  <https://github.com/advisories/GHSA-p8p7-x288-28g6>
- `form-data` e boundary previsível:
  <https://github.com/advisories/GHSA-fjxv-7rqg-78g4>
- configuração de requests Axios:
  <https://axios-http.com/docs/req_config>
- `dns.lookup` e resolução usada pelo socket Node:
  <https://nodejs.org/api/dns.html#dnslookuphostname-options-callback>
