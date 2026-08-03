# Whitelabel Whaticket — versão 1.24

Data: 2026-08-02
Estado: publicada

## Objetivo

Remover a família de vulnerabilidades Axios alcançável no backend e impor
budgets de tempo, redirects, upload e download às integrações externas.

## Baseline e pesquisa

- Axios resolvido: 1.7.7, classificado como alto pelo audit;
- chamadas ativas: Mercado Pago, Meta, Typebot, imagens de contato e
  transcrição;
- Typebot usava `maxBodyLength: Infinity`; downloads não tinham timeout/limite;
- Axios documenta que proteção contra decompression bomb é opt-in;
- o upstream sofreu comprometimento das versões 1.14.1/0.30.4 em março de
  2026; a escolha não usa essas versões nem segue `latest` cegamente;
- 1.18.0 corrige redirect/URL handling, limites e config pollution; o `gitHead`
  npm coincide com a tag oficial `v1.18.0`.

Fontes primárias:

- https://github.com/axios/axios/releases
- https://github.com/axios/axios/blob/v1.x/CHANGELOG.md
- https://github.com/axios/axios/security/advisories
- https://github.com/axios/axios/issues/10636
- https://docs.npmjs.com/cli/commands/npm-audit

## Mudança

- Axios backend fixado em 1.18.0;
- clientes separados para JSON, mídia e upload;
- timeout de 15/30/60 segundos conforme o workload;
- resposta limitada a 5 MiB para JSON/upload e 25 MiB para mídia;
- corpo limitado a 5 MiB para JSON/mídia e 32 MiB para upload;
- no máximo três redirects;
- todas as integrações ativas migradas para a composição central;
- contrato impede import direto de Axios e budgets infinitos.

## Evidência

- tag Git e `gitHead` npm: `2d06f96e8602c2db13b65a26340ee4a1bbc0b61f`;
- integridade do lock coincide com o registro npm;
- `npm audit signatures`: 1.376 assinaturas e 19 attestations verificadas;
- Axios/`follow-redirects` corrigido desapareceram do audit;
- audit completo caiu de 78 para 76 e a imagem runtime de 77 para 75 achados;
- compilação TypeScript e 6 testes focados aprovados;
- gate final passou em 37 suítes/124 testes e ambos os builds;
- produção respondeu API 1.24; smoke e containers aprovados;
- runtime confirmou Axios 1.18.0 e todos os budgets documentados;
- logs pós-rollout não apresentaram novo erro de integração.

## Compatibilidade e rollback

As APIs de chamada usadas permanecem compatíveis. Limites podem rejeitar
provedor lento ou payload anormal em vez de manter recursos indefinidamente.
Rollback: imagem 1.23; não há migration nem estado persistido novo.

## Como esta entrega ainda pode falhar?

- um provedor legítimo pode exceder os budgets escolhidos;
- URLs configuráveis ainda exigem defesa completa contra SSRF/DNS rebinding;
- integrações sem conta/canal real não podem ser exercitadas fim a fim;
- dependências legadas fora da família Axios continuam vulneráveis.
