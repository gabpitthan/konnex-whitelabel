# Tarefa ativa

Estado: pesquisa de confiabilidade concluída; preparação do lote P0 `REL-001`.

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

## Próximo passo

Receber a avaliação visual do usuário e migrar, em subversões controladas, os ambientes especializados: Dashboard, Atendimento, Kanban, FlowBuilder, campanhas e configurações.

Ao iniciar uma tarefa, registrar:

- pedido do usuário;
- resultado observável esperado;
- componentes afetados;
- riscos;
- critérios de aceite;
- plano de validação;
- estado e próximo passo.

Ao concluir, mover o resumo para o README da subversão e restaurar este arquivo para “aguardando”.
