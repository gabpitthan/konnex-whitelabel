# Relatório de qualidade — 1.8

## Evidência funcional

- Backend e frontend foram compilados como imagens de produção.
- Os dois serviços foram publicados juntos para evitar contrato misto.
- O smoke confirmou frontend ativo e `/version` em `1.8`.
- O navegador autenticado criou conexão Socket.IO em desktop e mobile.
- O namespace do tenant autenticado foi aceito.
- Um namespace estrangeiro foi rejeitado no ambiente publicado.

## Testes automatizados

Comando isolado:

`npx jest src/libs/__tests__/socketContract.spec.ts src/services/SocketServices/__tests__/AuthorizeTicketRoomService.spec.ts --runInBand --coverage=false`

Resultado:

- 2 suítes aprovadas;
- 8 testes aprovados;
- 0 falhas.

Cobertura comportamental:

- normalização de namespace;
- construção de salas segregadas;
- identidade válida;
- rejeição de token A no namespace B;
- rejeição de identidade malformada;
- validação de ticket numérico;
- consulta obrigatória por ticket e empresa;
- resposta genérica para ticket ausente ou estrangeiro.

## QA autenticado

Viewports: `1440×900` e `390×844`.

Em ambos:

- 0 erros de console;
- 0 exceções de página;
- 0 requisições falhas;
- 0 respostas HTTP 4xx/5xx após autenticação;
- 0 overflow horizontal;
- WebSocket da aplicação criado.

## Autoavaliação

| Dimensão | Nota (0–2) | Evidência |
|---|---:|---|
| Funcionalidade | 2 | build, deploy, smoke e conexão real |
| Segurança tenant | 2 | rejeição runtime + testes de serviço |
| Regressão | 2 | frontend/backend publicados juntos e QA autenticado |
| Responsividade | 2 | desktop/mobile sem overflow ou erro |
| Observabilidade | 2 | eventos estruturados e código de rejeição |
| Automação | 1 | testes novos existem; E2E ainda é temporário |

## Riscos remanescentes

- normalizador de emissores legados deve ser removido após migração incremental;
- ausência de um segundo tenant impede teste de ticket A/B com dados reais sem contaminar produção;
- sessões WhatsApp/Redis ainda são o próximo P0.
