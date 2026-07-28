# Estado atual e handoff

Atualizado em: 2026-07-28  
Versão ativa: 1.5

## Em foco

Primeira fundação do redesign integral implantada com a identidade aprovada **Konnex Signal**; aguardando validação visual do usuário.

## Estado operacional

- Frontend: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Docker Compose isolado em `/root/whitelabel-whaticket`.
- WhatsApp gera QR; conexão completa ainda depende de escaneamento e teste real.
- Não existe suíte automatizada relevante; builds Docker são o gate atual.
- Preflight, quality gate e smoke da versão 1.4 foram aprovados.
- Versão visual `1.5` publicada no commit `2076dab`.
- Build, deploy e smoke 1.5 aprovados; API pública responde `1.5`.
- Login Konnex Signal inspecionado em desktop 1440×900 e mobile 390×844.

## Próximo passo

Coletar a avaliação do usuário na URL publicada e continuar a migração das áreas especializadas em subversões controladas.

Áreas seguintes: Dashboard, Atendimento, Kanban, FlowBuilder, campanhas e configurações. Cada uma deve preservar comportamento e ser validada em 360/390, 768/1024, 1366 e 1920px.

## Fontes

- Arquitetura: `docs/project/ARCHITECTURE.md`
- Prioridades: `docs/project/ROADMAP.md`
- Problemas: `docs/project/ISSUES.md`
- Testes: `docs/project/TEST_MATRIX.md`
- Operação: `docs/project/RUNBOOK.md`
- Decisões: `docs/decisions/`
