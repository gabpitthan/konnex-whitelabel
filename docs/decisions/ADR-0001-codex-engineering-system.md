# ADR-0001 — Sistema de engenharia com Codex

Data: 2026-07-28  
Estado: aceito

## Decisão

Usar arquivos versionados como memória canônica, um workflow autônomo baseado em evidência, autoavaliação obrigatória e subagentes apenas para subtarefas independentes.

## Motivo

Conversas podem ser compactadas ou retomadas. O estado técnico precisa sobreviver fora do chat e não depender de conhecimento do usuário sobre ferramentas.

## Consequências

- Prompts simples são convertidos em critérios de aceite pelo agente.
- Toda entrega atualiza estado, testes e versão.
- O agente principal continua responsável por integração.
- Autonomia não elimina proteções contra ações destrutivas ou exposição de dados.
