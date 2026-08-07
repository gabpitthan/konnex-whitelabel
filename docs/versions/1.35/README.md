# Versão 1.35 — planos que limitam de verdade, e instalação que não nasce insegura

Data: 2026-08-07
Estado: implantada e verificada em produção
Motivação: preparar o produto para ser **vendido como código-fonte** e instalado
por terceiros.

## 1. As flags de plano eram decorativas

O modelo `Plan` tem dez flags de funcionalidade (`useCampaigns`, `useSchedules`,
`useInternalChat`, `useExternalApi`, `useKanban`, `useOpenAi`,
`useIntegrations`, `useWhatsapp`, `useFacebook`, `useInstagram`). Elas existiam
na tabela, apareciam na tela de planos — e **nenhuma rota as consultava**.

Comprovado antes da correção: uma empresa num plano com `useCampaigns: false`
criou uma campanha com `HTTP 200`.

Só `users` e `connections` tinham limite real, em `CreateUserService` e
`CreateWhatsAppService`.

**Por que isso importa para quem revende:** o comprador não conseguia vender
planos diferenciados. O cliente do plano barato alcançava tudo pela API, mesmo
com a interface escondendo o menu. Esconder no frontend não é limitar — é
sugerir.

### Mudança

`middleware/requirePlanFeature.ts` carrega o plano da empresa e nega quando a
flag está desligada, com mensagem que o usuário final entende:

```
403 {"error":"Esta funcionalidade (Campanhas) não está incluída no plano contratado."}
```

Aplicado em campanhas, listas de contato, itens de lista, agendamentos, chat
interno e integrações de fila — 44 rotas.

O tenant vem de `req.user` ou `req.apiConnection`, nunca do cliente. Empresa sem
plano resolvível recebe 403: falha fechado, a funcionalidade não é concedida por
omissão.

### Evidência

Plano restrito, mesma requisição que antes respondia 200:

```
campaigns      403        contacts   200
contact-lists  403        tickets    200
schedules      403        queue      200
chats          403        whatsapp   200
POST /campaigns 403 "Esta funcionalidade (Campanhas) não está incluída no plano contratado."
```

O que o plano inclui continua funcionando.

## 2. Segredos com valor de exemplo embutido

O código herdado tinha um valor padrão para cada segredo:

| Variável | Valor embutido | Efeito de esquecer |
|---|---|---|
| `JWT_SECRET` | `"mysecret"` | qualquer pessoa forja token de qualquer usuário de qualquer empresa |
| `JWT_REFRESH_SECRET` | `"myanothersecret"` | idem, na renovação |
| `REDIS_SECRET_KEY` | `"MULTI100"` | estado de sessão do WhatsApp exposto |
| `ADMIN_PASSWORD` | `"change-before-production"` | senha do admin conhecida |
| `VERIFY_TOKEN` | `"whaticket"` | webhook de Meta aceita chamada forjada |

Num produto instalado por terceiros a partir de um `.env` de 41 variáveis, a
chance de esquecer uma é alta. E esquecer o segredo do JWT não produz falha
visível: a aplicação sobe, o login funciona, e quem conhece o valor padrão —
público, porque o código deriva de projeto aberto — assina um token válido para
qualquer empresa. Autenticação inteira contornada, em silêncio.

### Mudança

`config/requiredSecrets.ts` roda antes de a aplicação escutar na porta e
**aborta o boot** quando um segredo obrigatório está ausente, é um valor de
exemplo conhecido, ou é curto demais. Emite aviso (sem bloquear) para
`ADMIN_PASSWORD` e `VERIFY_TOKEN`.

Os valores embutidos foram removidos de `config/auth.ts` e `config/redis.ts`.

A mensagem ensina o comprador a resolver:

```
A APLICAÇÃO NÃO VAI SUBIR: segredos obrigatórios ausentes ou inseguros.
  - JWT_SECRET não está definido — assina os tokens de sessão; com o valor
    padrão qualquer pessoa forja acesso a qualquer empresa
Como gerar um segredo forte:
  openssl rand -base64 48
```

Uma instalação que não sobe é um chamado de suporte. Uma instalação que sobe
insegura é um incidente que ninguém percebe.

### Evidência

Container sem `JWT_SECRET` aborta com a mensagem acima. A produção, com os
quatro obrigatórios em 64 caracteres, subiu normalmente.

## 3. Licença

O repositório não tinha `LICENSE`, apesar de derivar do Whaticket
(`canove/whaticket-community`, MIT, 2020). A MIT autoriza uso, modificação,
redistribuição e **venda**, inclusive comercial — mas **exige** que o aviso de
copyright e o texto da permissão sejam preservados nas cópias.

Ou seja: a licença que dá o direito de vender era a que estava sendo
descumprida, e o comprador herdaria o defeito.

`LICENSE` adicionado, preservando o copyright de origem e registrando o
copyright do trabalho derivado, com a seção de procedência explícita.

## Limites honestos

- `useKanban`, `useOpenAi`, `useExternalApi`, `useFacebook`, `useInstagram` e
  `useWhatsapp` **ainda não são impostos** — as rotas correspondentes não foram
  identificadas com a mesma clareza. O middleware existe e aplicá-las é
  mecânico; ficou fora deste lote para não crescer sem verificação.
- O guarda faz uma consulta ao banco por requisição protegida. Aceitável na
  escala atual; se virar gargalo, cachear por empresa com invalidação na
  troca de plano.
- O aviso de `ADMIN_PASSWORD` fraca não bloqueia o boot de propósito: bloquear
  quebraria instalações existentes que já rodam. Deve virar bloqueio quando a
  higiene de primeira instalação for tratada.

## Rollback

Imagem anterior. Sem migration, sem mudança de esquema, índice, cache ou dado.
