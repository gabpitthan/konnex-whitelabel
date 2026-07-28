# Whitelabel Whaticket — versão 1.4

Data: 2026-07-28  
Estado: implantada em desenvolvimento

## Objetivo

Criar a estrutura permanente de engenharia com Codex para desenvolvimento por prompts simples, com memória persistente, autoavaliação, subagentes, verificações e continuidade.

## Entregas

- Workflow autônomo de diagnóstico, implementação, teste, revisão e documentação.
- Definição objetiva de pronto.
- Papéis e regras para uso de subagentes.
- Memória separada em estado atual, roadmap, problemas, testes, arquitetura e runbook.
- Registro de tarefa ativa e decisões arquiteturais.
- Scripts de preflight, quality gate e smoke.
- Limpeza do `PROJECT_STATE.md`, removendo estados antigos contraditórios.
- Versão 1.4 sincronizada no frontend, backend e endpoint `/version`.

## Banco e multiempresa

Nenhuma migration. As regras tornam obrigatória a verificação backend de `companyId` e recomendam testes tenant A/B para toda rota alterada.

## Testes

- `scripts/preflight.sh`: aprovado.
- Validação de shell e `git diff --check`: aprovada.
- Build TypeScript do backend em Docker: aprovado.
- Build React de produção: aprovado com avisos legados.
- Imagens Docker de backend e frontend: geradas.
- Deploy isolado: concluído.
- `scripts/smoke-test.sh`: aprovado; frontend ativo e API em `1.4`.
- Relatório detalhado: `QUALITY_REPORT.md`.

## Limitações

- A base legada ainda não possui suíte automatizada relevante.
- Healthchecks de aplicação, CI e testes tenant A/B estão priorizados no roadmap, não simulados como concluídos.
- O snapshot só será criado quando o usuário declarar a versão pronta.
