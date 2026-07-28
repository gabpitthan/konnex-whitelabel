# Estado atual e handoff

Atualizado em: 2026-07-28  
Versão ativa: 1.7

## Em foco

Estabilização do shell e observabilidade em andamento. A navegação de duas camadas da 1.6 foi rejeitada e a tela branca reapareceu de forma intermitente.

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

Concluir 1.7 com menu único, drawer mobile sem barra inferior, Error Boundary e captura segura de erros frontend. Só depois retomar Atendimento e Contatos.

## Fontes

- Arquitetura: `docs/project/ARCHITECTURE.md`
- Prioridades: `docs/project/ROADMAP.md`
- Problemas: `docs/project/ISSUES.md`
- Testes: `docs/project/TEST_MATRIX.md`
- Operação: `docs/project/RUNBOOK.md`
- Decisões: `docs/decisions/`
