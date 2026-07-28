# Changelog

Todas as alterações relevantes deste projeto são documentadas aqui.

## [1.9] — 2026-07-29 — em desenvolvimento

### Objetivo

Primeira fase de confiabilidade do lifecycle WhatsApp e auth state Redis.

### Entregue

- auth state v2 tenant-aware, versionado e com checksum;
- migração lazy sem apagar rollback legado;
- falha explícita para Redis indisponível, corrupção e escrita;
- single-flight e geração de sessão em processo;
- timeout de inicialização;
- logout/reset/delete com cleanup coerente;
- boot parcial resiliente;
- testes de concorrência, isolamento, persistência e corrupção.

### Banco e migrations

- nenhuma migration;
- PostgreSQL inalterado;
- Redis migra sob demanda e preserva chaves legadas.

### Testes

- 18 testes automatizados do lote e regressão aprovados;
- backend e frontend compilados em imagens de produção;
- runtime canário WhatsApp ainda pendente.

## [1.8] — 2026-07-28 — em desenvolvimento

### Objetivo

Autenticar o Socket.IO e garantir isolamento multiempresa de namespace e salas.

### Entregue

- Contrato canônico `/workspace-{companyId}`.
- JWT real e usuário verificados no handshake.
- Token enviado por `auth`, nunca pela URL.
- Entrada em ticket validada por `ticketId + companyId`.
- Salas e payloads numéricos padronizados.
- Ciclo de socket do frontend corrigido para refresh, logout e troca de identidade.
- Testes automatizados de contrato e autorização.

### Testes

- 8 de 8 testes automatizados aprovados.
- Builds de produção aprovados.
- Deploy conjunto e smoke aprovados.
- QA autenticado desktop/mobile sem falhas.
- Token real aceito apenas no próprio namespace e rejeitado no namespace estrangeiro.

## [1.7] — 2026-07-28 — em desenvolvimento

### Objetivo

Estabilizar o frontend e implantar navegação única e observabilidade de erros do navegador.

### Prioridades

- Tela branca nunca silenciosa.
- Menu único com ícones e subgrupos.
- Remoção da barra inferior mobile.
- Logs frontend seguros e correlacionáveis.

### Testes

- Em execução.

## [1.6] — 2026-07-28 — em desenvolvimento

### Objetivo

Reconstruir a experiência como um novo CRM e corrigir as regressões observadas na primeira fundação visual.

### Prioridades

- Scroll e viewport.
- Ações acessíveis.
- Novo shell e arquitetura de navegação.
- Identidade e usabilidade que não reproduzam o Whaticket.

### Testes

- Preflight aprovado.
- Builds de backend e frontend aprovados.
- Deploy Docker concluído.
- Smoke aprovado com API em `1.6`.

### Entregue

- Novo shell CRM com espaços de trabalho e ferramentas contextuais.
- Navegação mobile inferior.
- Dashboard completamente reconstruído.
- Correções estruturais de scroll, viewport, modais e ações.

## [1.5] — 2026-07-28 — em desenvolvimento

### Objetivo

Implantar a identidade original Konnex Signal e iniciar a reformulação integral e responsiva do frontend.

### Direção

- Mudança de composição, navegação, hierarquia, componentes e comportamento responsivo.
- Preservação de lógica, APIs, sockets, rotas e permissões.
- Identidade documentada em ADR próprio.

### Testes

- Preflight aprovado.
- Builds de backend e frontend aprovados.
- Deploy Docker concluído.
- Smoke aprovado com API em `1.5`.
- Login inspecionado em 1440×900 e 390×844.

## [1.4] — 2026-07-28 — em desenvolvimento

### Objetivo

Instituir o sistema permanente de engenharia autônoma com Codex.

### Adicionado

- Workflow para desenvolvimento por prompts simples.
- Definição de pronto e protocolo de autoavaliação.
- Memória estruturada em `docs/project/`.
- Registro de tarefa ativa e decisões arquiteturais.
- Scripts de preflight, quality gate e smoke.
- README próprio da versão 1.4.

### Alterado

- `PROJECT_STATE.md` transformado em índice curto sem falhas antigas contraditórias.
- Regras de subagentes, loops finitos, encerramento e segurança incluídas em `AGENTS.md`.
- Versão técnica sincronizada em `1.4`.

### Testes

- Preflight e validação de shell aprovados.
- Build Docker de backend e frontend aprovado.
- Deploy isolado concluído.
- Smoke aprovado com frontend ativo e API `/version` em `1.4`.

## [1.3] — 2026-07-28 — em desenvolvimento

### Objetivo

Sincronizar a versão exibida no produto e criar documentação própria para cada subversão.

### Alterado

- Versão do frontend, backend, lockfiles e arquivo canônico atualizada para `1.3`.
- Menu lateral passa a mostrar a versão real do pacote.
- Endpoint `/version` deixa de depender de valor antigo no banco.
- Processo de snapshot passa a incluir o README da versão.

### Adicionado

- `docs/versions/1.1/README.md`.
- `docs/versions/1.2/README.md`.
- `docs/versions/1.3/README.md`.
- Regra permanente exigindo README para cada nova subversão.

### Testes

- Build TypeScript do backend aprovado.
- Build de produção do frontend aprovado, com avisos legados.
- Imagens e containers Docker recriados.
- Frontend local e público respondendo HTTP 200.
- Endpoint `/version` local e público respondendo `1.3`.

## [1.2] — 2026-07-28 — concluída

### Objetivo

Implantar governança permanente de desenvolvimento, versionamento incremental, memória e snapshots reproduzíveis.

### Adicionado

- Arquivo canônico `VERSION`.
- Instruções permanentes em `AGENTS.md`.
- Política detalhada em `docs/VERSIONING.md`.
- Script seguro `scripts/create-version-snapshot.sh`.
- Diretório externo reservado para versões em `/root/whitelabel-whaticket-versions`.
- Configuração local do Codex para novas sessões com aprovação `never`.

### Regras

- Cada lote funcional incrementa uma subversão.
- Número principal muda somente após o usuário declarar a versão pronta.
- Snapshots são criados apenas a partir de worktree limpo e commitado.
- Segredos e dados operacionais não entram nos arquivos de versão.

### Testes

- Estrutura documental criada.
- Script validado por análise de shell e será executado somente no fechamento de uma versão.

## [1.1] — 2026-07-28 — concluída como base de desenvolvimento

### Objetivo

Criar uma instalação isolada e estabelecer a primeira base segura e funcional para modernização.

### Adicionado

- Docker Compose isolado com PostgreSQL, Redis, backend e frontend.
- Publicação em `whitelabel.usekonnex.com`.
- HTTPS e proxy Nginx.
- Repositório Git e documentação persistente.
- Política formal de versões e snapshots.

### Alterado

- Baileys migrado do fork 6.7.5 para o pacote oficial 6.7.22.
- Descoberta dinâmica da versão WhatsApp Web.
- Reconexão com backoff e limite.
- Endpoint de início da sessão responde quando o QR fica disponível.
- Build Docker otimizado.
- Seeds deixaram de executar a cada reinício.

### Segurança

- Removido código destrutivo e telemetria externa desconhecida.
- Removidas consultas SQL interpoladas em configurações e mensagens.
- Exclusão e duplicação de FlowBuilder passaram a respeitar `companyId`.

### Testes

- Build TypeScript aprovado.
- Login e persistência aprovados.
- Endpoint autenticado do FlowBuilder aprovado.
- Geração do QR aprovada em menos de um segundo.

### Pendente

- Escanear QR e validar conexão completa.
- Validar envio, recebimento, mídias e reconexão.
- Ampliar isolamento multiempresa.
- Criar suíte automatizada.

### Commits

- `7d7cb80` — baseline.
- `ede0dc0` — atualização do Baileys e conexão WhatsApp.
