# Tarefa ativa

## Versão 1.15 — commit Message/Ticket protegido por fence

Estado: publicada

### Objetivo

Impedir que um owner WhatsApp obsoleto confirme Message e estado do Ticket
depois que outro processo assumiu a sessão.

### Critérios de aceite

- a linha de `Whatsapp` é validada por `id + companyId + sessionFence` e
  bloqueada durante a transação;
- troca concorrente do fence não pode ultrapassar a transação em andamento;
- `Ticket.lastMessage` e Message entram no mesmo commit;
- Socket.IO da Message somente ocorre após commit;
- rede, download e transcodificação não ficam dentro do lock;
- owner ou tenant incorreto falha fechado;
- testes, build, smoke e restart são aprovados.

### Fora deste lote

- criação/atualização de Contact e criação inicial de Ticket;
- desbloqueio do modo cluster;
- conta canário WhatsApp real.

### Resultado

- preflight, 14 suítes/53 testes e builds aprovados;
- API 1.15 e smoke aprovados antes/depois do restart;
- shutdown concluiu em 3 ms;
- próximo P0: tornar criação de Contact/Ticket concorrente e fenced sem manter
  I/O externo dentro da transação.

## Versão 1.14 — lookup de Message tenant-aware

Estado: publicada

### Critérios de aceite

- nenhuma busca ativa por `wid` omite `companyId`;
- ACK mantém tenant tanto no caminho direto quanto no Bull;
- quoted messages não cruzam tenants;
- build, regressão, smoke e restart aprovados;
- limites ficam na memória persistente.

### Resultado

- 13 suítes e 48 testes aprovados;
- imagens backend/frontend compiladas;
- API 1.14 e smoke aprovados antes/depois do restart;
- shutdown real fechou recursos em 4 ms;
- próximo P0: Ticket/Contact/fence na transação de ingestão.

## Versão 1.13 — idempotência de mensagens

Estado: publicada; incidente e recuperação registrados

### Critérios de aceite

- migration aborta com duplicidade e nunca reconcilia dados automaticamente;
- `companyId + wid` é único no banco e conhecido pelo modelo;
- persistência e ajustes são transacionais;
- nenhum Socket.IO é emitido se a transação falhar;
- índices exatamente redundantes são removidos;
- build, testes, migration, smoke e rollback operacional são registrados.

### Risco residual

O fence WhatsApp ainda não alcança todas as mutações de Ticket/Contact que
envolvem a mensagem. A 1.13 fecha a idempotência da linha Message, não libera
cluster.

## Versão 1.12 — escala, pool e readiness

Estado: publicada; próximo P0 selecionado

### Objetivo

Corrigir multiplicadores comprovados de conexão/SQL e implantar sinais de saúde
adequados antes de continuar a expansão de produção.

### Critérios de aceite

- nenhum serviço cria pool Sequelize ad hoc;
- ranges usam bind parameters e rejeitam datas/tenant inválidos;
- liveness não reinicia por falha transitória de dependência;
- readiness falha fechado para drain, PostgreSQL ou Redis;
- Docker expõe health status real;
- testes induzem dependência indisponível e validação inválida;
- pesquisa, baseline, decisão, rollback e riscos ficam persistidos;
- build, smoke, restart e versão 1.12 aprovados.

### Riscos

- healthcheck mal calibrado pode criar restart loop;
- redução imediata do pool de produção sem observar workload pode elevar espera;
- endpoint legado de range usa token global e ainda requer identidade tenant
  vinculada antes de ser considerado multiempresa forte.

Estado: versão 1.11 em implementação — fundação de lease/fencing distribuído.

## Pedido atual

Continuar o programa P0 após a publicação da 1.10.

## Resultado observável esperado

- apenas um runtime pode criar o socket de uma conexão WhatsApp;
- aquisição, renovação e release do lease são atômicos e tenant-aware;
- o fence monotônico vem do PostgreSQL e não regride com perda do Redis;
- status e credenciais rejeitam owners obsoletos;
- perda ou incerteza de ownership fecha o socket sem logout/purge;
- socket obsoleto não envia novas mensagens;
- modo cluster permanece bloqueado até as mutações internas de mensagens,
  tickets e contatos também serem transacionais e fenced.

## Componentes afetados

- lifecycle Baileys e registry de sessões;
- Redis, PostgreSQL e migration aditiva;
- auth state;
- status/QR da conexão;
- shutdown e reconexão;
- testes P0 e documentação operacional.

## Riscos e fronteiras

- pausa do processo além do TTL e takeover por outro runtime;
- owner antigo retomando callbacks atrasados;
- Redis indisponível ou resposta ambígua;
- purge/logout concorrente;
- isolamento por `companyId`;
- handlers longos ainda possuem janela TOCTOU fora deste lote.

## Critérios de aceite 1.11

- sequence PostgreSQL monotônica e `sessionFence` aditivo;
- Lua compare-token para acquire/renew/release;
- CAS por `id + companyId + sessionFence` nos estados do lifecycle;
- auth writes/deletes condicionadas ao lease;
- heartbeat e perda de lease testados sem logout/purge;
- tenant A/B e owner antigo negados;
- testes, builds, migration, restart e smoke aprovados;
- rollback por imagem 1.10 preservando coluna/sequence aditivas.

## Fora deste lote

- desbloquear `server-cluster.ts`;
- garantir atomicidade fenced em todas as mutações de Message/Ticket/Contact;
- idempotência/outbox de mensagens;
- canário WhatsApp real sem conta isolada disponível;

## Pedido

Transformar a aplicação em um novo CRM, eliminando a arquitetura visual e de uso herdada do Whaticket. Corrigir imediatamente rolagem e botões que desaparecem, reconstruir navegação, disposição e UX e preservar funcionamento.

## Nova diretriz permanente

Operar como um time completo por meio de `docs/JARVIS_ENGINEERING_SYSTEM.md`. Antes de novas evoluções, tratar falhas P0 confirmadas de Socket.IO, multi-tenancy e sessões WhatsApp.

## Feedback 1.7

- Remover rail com letras e submenu semelhante ao Whaticket.
- Criar menu único com ícones e subgrupos.
- Remover barra inferior mobile.
- Corrigir tela branca recorrente.
- Criar observabilidade para erros reais do navegador.

## Resultado esperado

- Nova fundação visual aplicada globalmente.
- Novo shell, menu e topbar responsivos.
- Páginas públicas e componentes transversais padronizados.
- Dashboard com composição operacional própria.
- Comportamentos existentes preservados.
- Build, deploy e smoke aprovados em `whitelabel.usekonnex.com`.

## Riscos

- Mistura de MUI v4/v5 e centenas de estilos locais.
- Fluxos críticos de atendimento e FlowBuilder altamente acoplados.
- Ausência de suíte de regressão automatizada.

## Critérios deste lote

- Build frontend/backend aprovado.
- Login e shell renderizam.
- API, versão, rotas e permissões permanecem.
- Layout utilizável em 360, 390, 768, 1024, 1366 e 1920px.
- Modais globais possuem ações acessíveis no mobile.
- Deploy e smoke aprovados.
- Uma única região de rolagem previsível por contexto.
- Nenhuma ação some ao abrir função, modal ou teclado.
- Shell e menu não mantêm a disposição visual do Whaticket.
- Navegação organizada por espaços de trabalho e contexto.

## Resultado 1.6

- Regressões de rolagem e ações corrigidas na base.
- Shell Whaticket substituído por navegação em espaços de trabalho.
- Navegação mobile inferior e painel adaptado.
- Dashboard interno completamente reconstruído.
- Build, deploy e smoke aprovados.

## Próxima migração

Atendimento e Contatos, seguidos por Kanban, Campanhas, FlowBuilder, Conexões e Configurações. Cada módulo deve mudar composição e usabilidade, não apenas tema.

## Resultado do lote

- Fundação Konnex Signal aplicada globalmente.
- Novo shell, sidebar, topbar e contexto de página implantados.
- Login, cadastro e recuperação reconstruídos.
- Componentes transversais e diálogos responsivos atualizados.
- Capturas reais validadas em 1440×900 e 390×844.
- Build e smoke aprovados na versão 1.5.

## Resultado 1.7

- Menu único implantado em desktop e mobile.
- Barra inferior e rail de letras removidos.
- Tela branca causada por corrida do socket corrigida.
- Error Boundary e telemetria sanitizada implantados.
- Configurações públicas, favicon e avatar corrigidos.
- Build, deploy, smoke e navegador autenticado aprovados.

## Resultado 1.8

- JWT, namespace e IDs Socket.IO padronizados.
- Namespace vinculado ao `companyId` assinado.
- Sala de ticket autorizada por ticket e empresa.
- Frontend envia token por `auth` e limpa/recria conexão por identidade.
- 8/8 testes aprovados.
- Prova runtime publicada rejeitou namespace estrangeiro.
- QA desktop/mobile e smoke aprovados.

## Próximo passo

Implementar `REL-002/003` com lease Redis, fencing/CAS e registry completo de
disposers. Preparar uma conta canário isolada antes de validar pareamento,
texto, mídia, queda de rede, restart e logout.

Fora deste lote:

- lease distribuído + fencing/CAS;
- registry de disposers completo;
- shutdown explícito de Bull, Sequelize e Redis;
- manifesto atômico de auth state;
- máquina de estados completa e canário WhatsApp real.

Ao iniciar uma tarefa, registrar:

- pedido do usuário;
- resultado observável esperado;
- componentes afetados;
- riscos;
- critérios de aceite;
- plano de validação;
- estado e próximo passo.

Ao concluir, mover o resumo para o README da subversão e restaurar este arquivo para “aguardando”.
