# Estado atual e handoff

Atualizado em: 2026-08-07
Versão ativa: 1.35 (implantada e verificada)

## Em foco

**1.35 — produto preparado para ser vendido como código-fonte.** Dois defeitos
que só aparecem quando outra pessoa instala e revende:

1. **As flags de plano eram decorativas.** Empresa num plano com
   `useCampaigns: false` criava campanha com HTTP 200 — nenhuma rota consultava
   as dez flags. Quem revende não conseguia vender planos diferenciados.
   `requirePlanFeature` aplicado em 44 rotas.
2. **Cada segredo tinha valor embutido** (`JWT_SECRET || "mysecret"`). Num `.env`
   de 41 variáveis, esquecer o do JWT entregava a autenticação inteira em
   silêncio. O boot agora aborta com mensagem que ensina a resolver.

Mais o `LICENSE` que faltava: a MIT do Whaticket autoriza a venda, mas exige o
aviso preservado — sem o arquivo, a licença que dá o direito era a descumprida.

Ver `docs/versions/1.35/README.md`.

## Anterior — 1.34

**1.34 — SEC-001 provado com duas empresas.** Primeiro teste real de isolamento
multiempresa do projeto. Leitura estava protegida; **escrita e exclusão não**:
a empresa B apagou um ticket da empresa A (com as mensagens, por cascata) e
leu, alterou e apagou mensagem rápida e lista de contatos de uma terceira.

Todas as rotas exigiam autenticação e todos os controllers tinham o `companyId`
em mãos — o defeito estava nos serviços, que buscavam por ID sem escopo. Escopo
aplicado em 9 famílias; regressão estática mais ataque real.

Custo registrado: o ticket 1 da produção e suas mensagens foram destruídos ao
provar a falha. Era dado de teste. O teste definitivo passou a usar empresa-alvo
descartável.

Ver `docs/versions/1.34/README.md`.

## Anterior — 1.33

**1.33 — vazamento entre empresas, fechado.** `/dashboard/ticketsUsers` e
`/dashboard/ticketsDay` respondiam **sem autenticação** e liam `companyId` da
query: qualquer pessoa na internet obtinha nome dos usuários e volume de
atendimento de qualquer empresa. Comprovado contra a produção (HTTP 200 com
dados reais) antes da correção, e fechado depois (401 nas mesmas requisições).

Junto: `/invoices/list` sem `isAuth`; `UserController.list` aceitando
`companyId` da query; e três endpoints da API externa saindo do `COMPANY_TOKEN`
global para a credencial por empresa. Regressão de classe em
`routes/__tests__/tenantAuthContract.spec.ts`, dentro do `quality-gate.sh`.

Ver `docs/versions/1.33/README.md`.

## Anterior

**1.32 — identidade de contato (LID).** É bloqueador de venda: contato que
escreve para o CRM entrava sem telefone utilizável, não deduplicava com a base
importada e quebrava campanha, relatório e integração.

A primeira correção cobriu só o caminho da mensagem e **não bastou** — com ela
no ar desde 00:47, a produção criou `100236483629289@lid` às 06:54, pelo handler
`contacts.update`. A segunda parte fecha esse caminho e mais dois
(`verifyRecentCampaign`, `typebotListener`). Ver `docs/versions/1.32/README.md`.

**Implantada em 2026-08-07 às 14:00.** A segunda parte ficou commitada às 13:15 e
**não foi construída nem implantada** até então: o backend em produção rodava a
imagem de 00:47 (`/version` respondia 1.31, `dist/` sem
`FindWhatsappContactByJidService`), e o bundle do frontend era de 12:02, anterior
aos commits de design system e cor de marca. Ou seja, durante quase uma hora o
handler que cria contato LID continuou ativo em produção com a correção "pronta"
no repositório. É a mesma falha de gate registrada em `CLAUDE.md`: código
commitado tratado como código no ar. **Verificar imagem em execução, e não só o
commit, faz parte do encerramento de lote.**

Verificado após o deploy: `/version` 1.32, `/health/ready` 200,
`FindWhatsappContactByJidService.js` presente no `dist/` em execução, o
`contacts.update` compilado retorna cedo quando o contato não existe, zero
migrations pendentes, conexão WhatsApp voltou a `CONNECTED` sozinha após o
restart (auth state v2 sobreviveu ao recreate do Redis) e o bundle servido passou
a ser `main.b191c00f.js`, com o validador hex de `brand.js` presente.

Prova que ainda falta, e que só o tráfego real produz: uma mensagem recebida de
uma conta com LID deve cair no contato do telefone, e nenhum contato novo pode
surgir por troca de foto de perfil. Baseline no momento do deploy: contatos 1
(`558896090796`), 2 (`210986577449008@lid`) e 3 (`100236483629289@lid`).

## Prioridade declarada

Produto funcionando e clientes primeiro; melhorias e segurança depois. Rodar
`scripts/product-state.sh` antes de escolher qualquer lote — o baseline de
produto, não `ROADMAP.md`/`ISSUES.md`, decide a prioridade.

## Redesign de UI/UX (aberto, ainda não é versão)

Design system versionado em `frontend/src/design-system/` (ADR-0004). A alavanca
são os overrides globais do MUI v4 derivados dos tokens: padronizam as 44 telas
de uma vez, sem tocar nos 211 arquivos que usam v4.

Entregue: tokens com 28/28 pares aprovados em WCAG AA, overrides globais,
navegação reescrita, primitivos, i18n em pt por padrão, `styles/styles.js`
neutralizado como segunda paleta, cor de whitelabel do tenant devolvida ao tema.

Falta para virar versão: **nenhuma tela real usa os primitivos** — só a vitrine
em `/design-system` —, então o critério de aceite da tela-piloto não está
cumprido. Restam ~414 cores hardcoded (eram 708). Dashboard e Tickets/Chat não
foram tratados.

## Estado operacional

- Frontend: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Docker Compose isolado em `/root/whitelabel-whaticket`.
- WhatsApp gera QR; conexão completa ainda depende de escaneamento e teste real.
- A suíte P0 ainda não cobre todo o produto, mas possui 34 testes focados em auth state, lifecycle, lease/fencing, shutdown, Redis e Socket.IO.
- Socket.IO usa namespace autenticado, IDs numéricos e sala de ticket segregada por empresa.
- Testes: 8/8 aprovados; navegador autenticado desktop/mobile limpo.
- Prova runtime: namespace próprio aceito e estrangeiro rejeitado.
- Auth state v2 é tenant-aware, versionado, validado por checksum e mantém rollback legado.
- Starts concorrentes no mesmo processo são coalescidos e sockets antigos recebem geração inválida.
- Logout, reset e exclusão agora limpam o estado realmente usado pelo runtime.
- Novos starts são recusados durante drain.
- Reinício encerra timers, listeners de sessão, WebSockets e Socket.IO sem logout/purge de auth.
- Limpeza por pattern usa `SCAN` + `UNLINK`, sem `KEYS`.
- `server-cluster.ts` falha explicitamente até existir exclusividade distribuída real.
- Lease usa token opaco, TTL, renovação e release compare-value.
- Fence monotônico é persistido e lifecycle/auth state rejeitam owner obsoleto.
- Perda do lease fecha o socket sem logout/purge; operações destrutivas são
  serializadas e mantêm o lease até o fim.
- Redis indisponível falha fechado e não aceita comandos tardios pela offline queue.
- O modo cluster continua bloqueado: handlers de domínio ainda possuem janela
  TOCTOU entre a checagem do lease e a mutação PostgreSQL.
- Migration aplicada, API/frontend em 1.11 e smoke pós-deploy aprovados.
- Restart real recebeu `SIGTERM`, fechou os recursos em 1 ms e retornou sem
  migration pendente.
- Backend/frontend possuem healthchecks; readiness exige aplicação fora de
  drain, PostgreSQL e Redis disponíveis.
- Conexões ociosas da aplicação caíram de 6 para 1 após estabilização.
- Redis está em `noeviction` com AOF `everysec`; como guarda auth/leases, não
  será tratado como cache descartável.
- `Messages(companyId,wid)` agora é único; criação e reload são transacionais e
  Socket.IO ocorre após commit.
- Backup pré-1.13 foi restaurado com sucesso; o primeiro rollout falhou fechado
  ao encontrar dependência de constraint e foi recuperado sem alteração de dados.
- Quoted messages WhatsApp/Facebook, ACK direto/Bull e deleção consultam Message
  por `wid + companyId`.
- A regressão total passou em 13 suítes/48 testes; smoke da API 1.14 passou
  antes/depois do restart e o shutdown fechou recursos em 4 ms.
- A transação de mensagem bloqueia `Whatsapps` pelo fence e o Ticket pelo
  tenant/conexão; Socket.IO ocorre somente após commit.
- A regressão total passou em 14 suítes/53 testes; smoke da API 1.15 passou
  antes/depois do restart e o shutdown fechou recursos em 3 ms.
- Contact e Ticket inicial são persistidos sob o row lock do fence; chamadas de
  perfil permanecem fora da transação.
- Ticket WhatsApp ativo é único por tenant/contato/conexão.
- `unreadMessages` usa incremento atômico PostgreSQL; Redis é somente espelho.
- Backup foi restaurado com 57 tabelas e a migration passou em up/down/up.
- Produção aplicou o índice em 77 ms; 18 suítes/62 testes, builds, smoke e
  restart passaram; shutdown fechou recursos em 1 ms.
- Bearer determina conexão, tenant e canal sem confiar em `companyId` externo.
- Token e uso diário possuem índices únicos parciais; contabilização usa UPSERT.
- Backup 1.17 restaurou 57 tabelas e migration passou em up/down/up.
- Produção aplicou os índices em 113 ms; 21 suítes/81 testes e builds passaram.
- API 1.17, negativa 401 e restart passaram; shutdown fechou recursos em 2 ms.
- Rate limit usa Lua atômico, TTL e chave tenant/conexão sem credencial.
- Integração Redis 7 aprovou concorrência 1–20 e isolamento entre conexões.
- 22 suítes/85 testes, builds, API 1.18 e restart passaram; shutdown em 3 ms.
- Tokens novos usam CSPRNG backend e só aparecem em create/rotate.
- Listas, detalhe, updates, sockets e upload não dependem de expor/reler token.
- `/whatsapp/all` foi corrigido para o tenant autenticado.
- 26 suítes/90 testes, builds e runtime 1.19 passaram; shutdown em 1 ms.
- Tokens novos são armazenados somente como HMAC-SHA-256 com pepper externo ou
  subchave HKDF domain-separated do master existente.
- Lookup por prefixo reduz candidatos; comparação usa `timingSafeEqual`.
- Rotate/revoke usam transação e row lock; o anterior permanece em `grace` por
  15 minutos e pode ser revogado atomicamente.
- Backup pré-1.20 foi restaurado e a migration passou em up/down/up.
- Produção criou tabela, coluna e quatro índices em 216 ms.
- 30 suítes/101 testes, builds, API 1.20, compatibilidade legada e negativa 401
  foram aprovados.
- Smoke encontrou e corrigiu `checkNumber` sem número: entrada agora é
  normalizada/validada e retorna 400; sete casos adicionais passaram.
- Contexto autenticado distingue somente `legacy|digest`, sem token/prefixo.
- Os contadores entram no mesmo UPSERT diário e não alteram `UsedOnDay`.
- Relatório admin é tenant-aware e bloqueia contract antes de 30 dias, uso
  digest e ausência total de legado ativo/usado.
- Backup pré-1.21 foi restaurado e migration passou em up/down/up em 31–42 ms.
- 33 suítes/113 testes e builds passaram; produção aplicou migration em 92 ms.
- Runtime mostrou uma credencial legada ativa e readiness falso, como esperado.
- API 1.21, frontend 200 e restart em 2 ms foram aprovados.
- `pg_stat_statements` opera com 5.000 entradas, top-level, planning/utility off.
- Relatório local retorna apenas agregados e query IDs, sem texto SQL/PII.
- Laboratório PostgreSQL 16 e restore up/down/up aprovaram configuração/rollback.
- Gate passou em 34 suítes/115 testes e ambos os builds; logger ganhou teste
  ISO UTC adicional.
- Produção aplicou extensão em 113 ms; API 1.22, frontend 200 e restart em 2 ms.
- Primeiro snapshot: 2/100 conexões, cache 99,9936%, zero locks, idle
  transaction, deadlocks e temp spill; pior máximo 14,322 ms.
- Clientes externos não confiáveis agora negam redes privadas/especiais,
  validam todos os A/AAAA por conexão e entregam o IP aprovado ao socket.
- Redirect, proxy e socket path estão desabilitados; pools são limitados a 32
  sockets e 4 livres por protocolo.
- Gate 1.25 passou em 38 suítes/157 testes e builds; produção, smoke e bloqueio
  controlado de metadata passaram sem expor URL/IP/token/tenant no log.
- Nenhum índice/cache/tuning foi aplicado por falta de evidência de gargalo.
- Logger deixou timestamp local ambíguo e agora emite ISO-8601 UTC correto.
- `messageRoutes` possui um único mount e o webhook social existe somente em
  `/webhook`; a raiz voltou ao 404 normal.
- Gate 1.23 passou em 36 suítes/118 testes e ambos os builds; API 1.23,
  frontend 200 e containers saudáveis foram confirmados em produção.
- Axios backend 1.18.0 coincide com a tag upstream e possui SLSA provenance;
  1.376 assinaturas e 19 attestations do grafo instalado foram verificadas.
- JSON, mídia e upload possuem budgets próprios de 15/30/60 s, 5/25 MiB de
  resposta, 5/32 MiB de corpo e três redirects.
- Erros Axios serializados ocultam Authorization e parâmetros de token; métodos
  Meta deixaram de embutir token na URL.
- Audit runtime caiu de 77 para 75 achados; Axios e seus transitivos corrigidos
  não aparecem mais. Permanecem 8 críticos em famílias legadas.
- Gate 1.24 passou em 37 suítes/124 testes e ambos os builds; API 1.24,
  smoke e budgets runtime foram aprovados.
- Janela PostgreSQL de 2026-08-02: cache 99,9951%, 2/100 conexões, zero locks,
  deadlocks, idle transaction e temp spill; nenhum tuning é necessário.
- Bull 3.29.3 é at-least-once; ACK/mensagem agora propagam erros para retry/DLQ.
- Completed retém 1 h/100 e failed 7 dias/500; logs omitem payload e mensagem.
- ACK desabilitado não cria mais clientes Redis vazios nem loop de erro.
- Gate completo 40/168, correção final 4/14 e builds passaram; produção 1.26,
  DLQ induzida e smoke foram aprovados.
- Restart fechou seis filas sem falhas em 538 ms; ACK desabilitado fechou zero.
- Schedule usa claim PostgreSQL bounded/ordenado com SKIP LOCKED e UUID estável.
- Redis recebe somente scheduleId/companyId/dispatchKey, nunca snapshot/contato.
- Execução AGENDADA→PROCESSANDO exige tenant, chave e status exatos; duplicata
  retorna antes de carregar dados ou enviar.
- companyId de Schedules é NOT NULL e três índices cobrem due/recovery/UUID.
- Laboratório PG16 dividiu 20 claims em 7/7/6/0; CAS iniciou 1 de 2 workers.
- Gate 1.27 passou em 46 suítes/178 testes e builds; migration produção 170 ms.
- API 1.27, runtime controlado, smoke e restart em 568 ms foram aprovados.
- CampaignShipping ganhou owner/FK composta, unicidade, estado validado e CAS;
  confirmação cria uma única segunda fase com UUID nova.
- Endpoints show/update/delete/media/cancel/restart de campanha agora usam o
  tenant autenticado; o scanner não interpola mais ID em SQL.
- Create/update validam ContactList/Whatsapp/User/Queue no tenant; workers de
  preparação/disparo usam consultas leves, evitando carregar N contatos N vezes.
- Índice parcial do scanner segue `updatedAt,id` e inclui IDs/tenant/chave.
- Backup pré-1.28 0600/SHA-256 e cadeia final up/down/up em 232/162/255 ms;
  execução e confirmação concorrentes produziram 1/0.
- Gate 52 suítes/197 testes e builds passou; produção migrou estado/FK/índice
  em 162/51/57 ms e confirmou FK CASCADE e índice coberto.
- Prova publicada com rollback deu CAS/confirm 1/0, sem dado sintético; API
  1.28, frontend, smoke e restart em 557 ms foram aprovados.
- Reconciliação 1.29 lista apenas PROCESSING antigo do tenant e exige decisão
  admin atual, UUID CAS e justificativa; auditoria e estado são atômicos.
- Laboratório final passou migration em 143/48/107 ms, CHECK inválido e
  concorrência 1 sucesso/1 conflito/1 auditoria, sem resíduos.
- Gate 57 suítes/212 testes e builds passou; produção migrou em 191 ms e repetiu
  concorrência 1/1 conflito com limpeza 0/0.
- E2E autenticado desktop/mobile executou reconhecer→auditar, sem overflow,
  console/page error ou request failure. Restart fechou seis filas em 542 ms e
  retornou 1.29 saudável, sem migration pendente.
- GitHub `gabpitthan/konnex-whitelabel` é o único repositório público; README,
  CI, segurança, contribuição e templates estão versionados.
- Baseline 1.30 confirmou Bull Board desabilitado, Redis ACK ausente e nenhuma
  credencial configurada em produção.
- A remoção de `bull-board`/`basic-auth` eliminou EJS/React Highlight do grafo e
  reduziu o audit runtime de 76/9 críticas para 72/7 críticas.
- Gate passou em 58 suítes/214 testes e ambos os builds; produção confirmou
  rota antiga 404, pacotes ausentes, versão 1.30 e shutdown/retorno saudável.

## Próximo passo

1. Provar a 1.32 em produção: mensagem recebida de conta com LID deve cair no
   contato do telefone, e troca de foto de perfil não pode criar contato novo.
   O código está no ar desde 14:00; falta o tráfego real. Depende de Gabriel
   enviar uma mensagem de uma conta com LID para `558896397849`.
2. Fechar o redesign com uma tela real migrada para os primitivos — hoje só a
   vitrine os consome, e sem isso a cobertura não é mensurável.
3. Jornada WhatsApp que falta: mídia (imagem, áudio, documento) e grupos.
4. Isolamento multiempresa (SEC-001): existe uma só empresa em produção. Criar
   uma segunda por signup e provar que nenhuma enxerga dado da outra. É o
   pré-requisito real para vender multiempresa.
5. SMTP: `MAIL_HOST/USER/PASS/FROM` vazios, então "esqueci minha senha" e
   convite de usuário não funcionam.
6. Higiene pré-cliente: o seed `Empresa 1` e o admin semeado precisam sair.
7. Substituir `scripts/smoke-test.sh`, que só faz `curl /version` + `curl --head`
   — exatamente o "HTTP 200 não prova nada" que o `CLAUDE.md` proíbe, e que
   também não detectaria um bundle mais velho que o código.
8. Observabilidade: `SENTRY_DSN` vazio, `/client-errors` não persiste, log sem
   request ID, sem métricas e sem alerta.

A rotação do cliente API e as famílias de vulnerabilidade restantes continuam
abertas, atrás dos itens acima por decisão de prioridade.

## Fontes

- Arquitetura: `docs/project/ARCHITECTURE.md`
- Prioridades: `docs/project/ROADMAP.md`
- Problemas: `docs/project/ISSUES.md`
- Testes: `docs/project/TEST_MATRIX.md`
- Operação: `docs/project/RUNBOOK.md`
- Engenharia (autoridade): `CLAUDE.md` → `.engineering/jarvis/` (ENGINEERING OS)
- Pesquisa: `docs/research/WHATICKET_RELIABILITY_2026.md`
- Backlog de confiabilidade: `docs/project/RELIABILITY_BACKLOG.md`
- Decisões: `docs/decisions/`
