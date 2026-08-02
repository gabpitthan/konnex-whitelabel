# Whitelabel Whaticket — versão 1.23

Data: 2026-08-01
Estado: publicada

## Objetivo

Remover mounts duplicados e um alias público de webhook não documentado,
reduzindo superfície, ambiguidade e travessia desnecessária da stack Express
sem alterar URLs canônicos.

## Pesquisa primária

- Express, using middleware:
  https://expressjs.com/en/guide/using-middleware.html
- Express, writing middleware:
  https://expressjs.com/en/4x/guide/writing-middleware/
- Express Router API:
  https://expressjs.com/en/5x/api/router/

O Express processa middleware na ordem de montagem. `router.use()` sem path usa
`/`; handlers que encerram a resposta impedem que duplicatas posteriores sejam
alcançadas, mas a segunda stack permanece registrada e caminhos sem match a
percorrem novamente.

## Baseline confirmado

- `messageRoutes` estava montado duas vezes consecutivas;
- `webHookRoutes` estava corretamente em `/webhook` e novamente, por alias, em
  `/`, tornando GET/POST da raiz callbacks sociais;
- runtime com token inválido devolveu 403 tanto em `/` quanto em `/webhook`;
- frontend usa `/webhook` e não usa callback raiz;
- zero conexões Facebook/Instagram e nenhum evento social observado desde o
  deploy anterior;
- todas as URLs de mensagens usadas pelo frontend pertencem ao mount canônico.

## Mudança

- manter exatamente um mount de `messageRoutes`;
- manter webhook somente em `/webhook`;
- remover import alias redundante e import não usado;
- teste de contrato lê a composição raiz e impede regressão.

## Compatibilidade e rollback

O caminho canônico `/webhook` não muda. `/` deixa de aceitar GET/POST social e
passa ao 404 normal. Rollback: imagem 1.22; não há migration nem estado novo.

## Evidência de publicação

- preflight e builds Docker de backend/frontend aprovados;
- 36 suítes e 118 testes aprovados, incluindo 2 contratos de montagem;
- API publicou `1.23` e frontend respondeu 200;
- raiz mudou de 403 para 404, `/webhook` inválido permaneceu 403;
- rota de mensagens com Bearer inválido respondeu 403, provando que o mount
  canônico continua alcançável e protegido;
- containers backend/frontend permaneceram saudáveis após o rollout.
