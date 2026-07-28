# Whitelabel Whaticket — versão 1.5

Data: 2026-07-28  
Estado: implantada para validação

## Objetivo

Implantar a primeira versão funcional da reformulação visual integral **Konnex Signal**, mantendo o comportamento existente.

## Escopo

- tokens, temas claro/escuro e fundação global;
- shell autenticado, sidebar, topbar e navegação;
- componentes transversais;
- autenticação;
- dashboard representativo;
- tabelas, diálogos, formulários e responsividade globais;
- documentação persistente da identidade.

## Compatibilidade

APIs, banco, rotas, sockets, autenticação, permissões e regras de negócio devem permanecer inalterados.

## Testes

- Preflight e consistência de versões: aprovados.
- Build TypeScript do backend: aprovado.
- Build React de produção: aprovado com avisos legados.
- Deploy Docker isolado: concluído.
- Smoke: aprovado; frontend ativo e API em `1.5`.
- Captura real desktop em 1440×900: aprovada.
- Captura real mobile em 390×844: aprovada.
- Login público carregado em produção sem asset externo.

## Limitações

O legado possui centenas de estilos locais. A versão 1.5 estabelece e aplica a fundação ampla; áreas especializadas como Dashboard, Atendimento, Kanban e FlowBuilder continuarão recebendo migrações visuais controladas nas próximas subversões após validação do usuário.

Não existe suíte E2E suficiente para afirmar regressão completa de todas as 38 rotas. Por isso, a migração visual continuará incrementalmente, sem alterações simultâneas de regra de negócio.
