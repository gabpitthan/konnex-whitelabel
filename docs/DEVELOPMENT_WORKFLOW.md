# Fluxo de desenvolvimento com Codex

Este documento permite ao usuário trabalhar por pedidos simples, como “corrija o login” ou “adicione filtros”.

O protocolo completo e vinculante é o ENGINEERING OS em `.engineering/jarvis/`, carregado pelo `CLAUDE.md`. Este arquivo resume o fluxo; em divergência, prevalece o ENGINEERING OS.

## Ciclo automático

1. **Contexto:** ler regras, estado atual, roadmap, problemas e Git.
2. **Descoberta:** mapear frontend, API, serviço, banco, tenant e infraestrutura afetados.
3. **Aceite:** traduzir o pedido em resultados observáveis e registrar em `tasks/ACTIVE.md`.
4. **Baseline:** reproduzir o comportamento antes de editar.
5. **Implementação:** aplicar o menor lote completo e reversível.
6. **Validação:** testar caminho feliz, erros, persistência, permissões e regressões.
7. **Autoavaliação:** revisar o diff e responder à definição de pronto.
8. **Deploy:** construir, implantar apenas no projeto correto e rodar smoke.
9. **Memória:** atualizar estado, problemas, testes, changelog e README da versão.
10. **Entrega:** informar resultado, evidências, limitações e próximo risco.

## Regra P0

Falhas em autenticação, isolamento multi-tenant, integridade de dados, WhatsApp, tickets/mensagens ou tela branca congelam novas funcionalidades na superfície afetada até:

1. causa comprovada;
2. correção;
3. teste de regressão;
4. validação runtime;
5. observação pós-deploy.

## Subagentes

O agente principal pode delegar análises independentes:

- engenharia: arquitetura e implementação;
- QA: reprodução, regressão, mobile e persistência;
- segurança: autenticação, `companyId`, SQL e segredos;
- operações: Docker, banco, deploy, rollback e saúde;
- UX: clareza, responsividade e fluxo real.

Subagentes não devem editar simultaneamente os mesmos arquivos. O agente principal revisa toda contribuição.

## Loop de solução

`reproduzir → hipótese → correção → teste → revisão`

O loop é limitado a três tentativas baseadas em evidência. Se persistir, registrar tentativas, logs seguros, hipóteses descartadas e dependência externa necessária.

## Níveis de validação

- Documentação: preflight e revisão de links/consistência.
- Backend: lint, TypeScript, testes relevantes e build.
- Frontend: teste relevante, build e verificação responsiva.
- Banco/multitenant: migration, rollback e testes tenant A/B.
- Deploy: containers, HTTP, versão, login e rota crítica.

## Autonomia com proteção

Autonomia cobre leitura, edição, testes, builds e deploys do projeto solicitado. Não cobre apagar bancos, expor credenciais, enviar mensagens a clientes, alterar outros sistemas ou executar migrations irreversíveis sem salvaguardas.
