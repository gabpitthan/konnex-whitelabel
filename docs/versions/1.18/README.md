# Whitelabel Whaticket — versão 1.18

Data: 2026-07-30  
Estado: publicada

## Objetivo

Limitar chamadas da API externa por tenant/conexão de forma distribuída,
atômica e anterior ao processamento de upload.

## Fontes

- OWASP REST Security:
  https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- RFC 7009:
  https://www.rfc-editor.org/rfc/rfc7009
- Redis rate limiter:
  https://redis.io/docs/latest/develop/use-cases/rate-limiter/
- Redis INCR:
  https://redis.io/docs/latest/commands/incr/

## Decisão

- autenticar primeiro para obter identidade estável;
- limitar antes do Multer para poupar CPU, memória e banda;
- executar `INCR + EXPIRE + TTL` em um script Lua atômico;
- chavear somente por versão, tenant e conexão, nunca pelo token;
- retornar 429 e `Retry-After` ao exceder;
- falhar fechado com 503 se Redis não garantir o limite;
- usar janela e teto configuráveis, com defaults 60/60 s e limites defensivos.

## Evidência

- 22 suítes/85 testes aprovados;
- integração Redis 7 aprovou 20 incrementos concorrentes, TTL e isolamento;
- builds backend/frontend aprovados;
- API 1.18 e negativa 401 aprovadas;
- reinício recebeu SIGTERM e fechou recursos em 3 ms;
- API 1.18 retornou após o reinício sem migration pendente.

## Limites

Janela fixa permite burst na fronteira. O Redis compartilhado continua sendo
estado crítico com `noeviction`; as chaves do limiter têm TTL e cardinalidade
limitada a conexões ativas, mas a separação de papéis permanece necessária
antes de escala horizontal ampla.
