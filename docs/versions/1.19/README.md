# Whitelabel Whaticket — versão 1.19

Data: 2026-07-30  
Estado: publicada

## Objetivo

Remover dependências de exposição e geração client-side do token legado antes
da migração para digest, sem invalidar o cliente atual.

## Mudanças

- geração de 256 bits via `crypto.randomBytes` no backend;
- segredo retornado somente na criação ou rotação explícita;
- rotação restrita a admin e conexão WhatsApp do próprio tenant;
- updates comuns não recebem nem alteram token;
- listas, detalhes, respostas e sockets não expõem token;
- upload usa `req.apiConnection.companyId`, sem reler Authorization;
- `/whatsapp/all` agora exige `companyId` na consulta;
- implementação duplicada e sem rota removida do MessageController;
- frontend não gera token com `Math.random` nem espera segredo em GET.

## Rollback

Imagem 1.18. Não há migration neste lote; o token atual permanece na mesma
coluna e continua aceito pelo middleware.

## Evidência

- 26 suítes/90 testes aprovados;
- backend e frontend compilados em imagens reproduzíveis;
- API e frontend 1.19 responderam;
- prova autenticada em lista, lista total e detalhe retornou `tokenKey=false`;
- lista total retornou somente o tenant autenticado;
- nenhuma rotação foi executada contra a credencial real;
- restart sem migration pendente; shutdown concluiu em 1 ms.

## Limites

Rotação ainda revoga o token anterior imediatamente. Digest com pepper, janela
dual, expiração e auditoria serão adicionados na fase seguinte.
