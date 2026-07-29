# Relatório de qualidade — 1.10

## Escopo auditado

- processo de shutdown e sinais do container;
- timers, listeners e sessões Baileys;
- inicialização durante drain;
- encerramento Socket.IO;
- limpeza Redis por pattern;
- modo cluster;
- build backend/frontend;
- lint e dívida de dependências.

## Evidência pré-deploy

- TypeScript/backend: aprovado;
- testes automatizados: 6 suítes, 22 testes, todos aprovados;
- frontend produção: aprovado;
- lint dos arquivos novos: aprovado;
- `git diff --check`: aprovado.

## Descobertas

- o lint global estava quebrado por `prettier/@typescript-eslint`, removido desde eslint-config-prettier 8;
- após reparar a configuração, foram medidos 2.975 problemas legados;
- npm reportou 95 vulnerabilidades no backend e 105 no frontend;
- bundle principal do frontend possui 1,68 MB gzip;
- `server-cluster.ts` era incompatível com exclusividade de sessão WhatsApp.

## Decisão

Não executar `npm audit fix --force` nem autoformatar todo o legado neste lote. Ambas as ações misturariam milhares de alterações com o lifecycle crítico e ampliariam o risco de regressão. A dívida foi tornada observável e deve ser reduzida por famílias, com testes de contrato e runtime.

## Gate pós-deploy

Comprovado:

- API e frontend em `1.10`;
- Node executado diretamente como processo principal do container;
- logs estruturados dos três estágios de shutdown após `SIGTERM`;
- recursos monitorados fechados em 2 ms, sem atingir a janela de 40 s;
- backend recuperado após restart, sem migration;
- smoke pós-restart aprovado.

Não repetido neste deploy:

- conta canário WhatsApp e preservação de estado criptográfico conectado;
- QA autenticado desktop/mobile;
- isolamento Socket.IO próprio/estrangeiro.

O frontend e o contrato Socket.IO não foram alterados neste lote. As últimas
evidências autenticadas permanecem nas versões 1.9 e 1.8; os itens acima não
são apresentados como nova comprovação da 1.10.

## Como ainda pode falhar

- dois processos ainda podem abrir a mesma sessão;
- recursos Bull/Sequelize/Redis dependem do encerramento do processo após o cleanup principal;
- listeners criados fora do lifecycle central podem exigir disposer próprio;
- somente um canário real comprova mensagens e estado criptográfico através de um restart.
