# Whitelabel Whaticket — versão 1.6

Data: 2026-07-28  
Estado: implantada para validação

## Objetivo

Iniciar a reconstrução real da aplicação como um novo CRM, corrigindo regressões da 1.5 e substituindo arquitetura de navegação e uso herdada do Whaticket.

## Feedback incorporado

- A 1.5 ficou clean e profissional, mas sem personalidade suficiente.
- Menu, botões e disposição continuaram semelhantes ao Whaticket.
- Existem problemas de rolagem.
- Algumas ações desaparecem ao abrir funções.
- O redesign precisa alterar UX, hierarquia, navegação e composição, não apenas aparência.

## Escopo inicial

- correção estrutural de scroll e viewport;
- ações sempre acessíveis;
- AppShell novo;
- navegação por espaços de trabalho;
- painel contextual de ferramentas;
- topbar contextual;
- navegação mobile própria;
- preservação de rotas, permissões, plano, sockets e regras.

## Testes

- Preflight: aprovado.
- Build TypeScript do backend: aprovado.
- Build React de produção: aprovado com avisos legados.
- Deploy Docker isolado: concluído.
- Smoke com espera de startup: aprovado.
- Frontend ativo e API respondendo `1.6`.

## Entregue

- Shell totalmente novo com rail de espaços e ferramentas contextuais.
- Espaços: Central, Atendimento, Campanhas, Automação, Gestão e Sistema.
- Topbar contextual e navegação mobile inferior.
- Dashboard reconstruído como central operacional.
- Correções de scroll, viewport, safe area e ações inacessíveis.
- Dashboard preserva consultas, filtros, exportação, permissões e dados existentes.

## Limitações

Esta versão inicia a substituição real do Whaticket, mas os módulos Atendimento, Contatos, Kanban, Campanhas, FlowBuilder, Conexões e Configurações ainda precisam de reconstrução interna nas próximas subversões. Eles já recebem o novo shell, mas não serão chamados de concluídos enquanto sua UX interna permanecer legada.
