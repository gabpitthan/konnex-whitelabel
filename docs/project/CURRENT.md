# Estado atual e handoff

Atualizado em: 2026-07-28  
Versão ativa: 1.6

## Em foco

Reconstrução do frontend como novo CRM em andamento. A versão 1.6 substituiu o shell, corrigiu regressões estruturais e reconstruiu o Dashboard.

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

Migrar internamente Atendimento e Contatos; depois Kanban, Campanhas, FlowBuilder, Conexões e Configurações. Nenhum módulo será considerado pronto apenas por herdar o novo shell.

## Fontes

- Arquitetura: `docs/project/ARCHITECTURE.md`
- Prioridades: `docs/project/ROADMAP.md`
- Problemas: `docs/project/ISSUES.md`
- Testes: `docs/project/TEST_MATRIX.md`
- Operação: `docs/project/RUNBOOK.md`
- Decisões: `docs/decisions/`
