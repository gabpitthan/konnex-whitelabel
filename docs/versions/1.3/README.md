# Whitelabel Whaticket — versão 1.3

Data: 2026-07-28  
Estado: implantada em desenvolvimento

## Objetivo

Sincronizar a versão técnica com a versão apresentada ao usuário e instituir um README completo para cada subversão.

## Alterações

- Frontend passa a exibir `Versão 1.3` a partir do próprio pacote.
- Removido texto hardcoded `Versão 13.8.2`.
- Endpoint backend `/version` passa a responder a versão do pacote implantado.
- Frontend, backend, lockfiles e arquivo `VERSION` sincronizados em `1.3`.
- README individual passou a ser obrigatório por subversão.
- READMEs históricos das versões 1.1 e 1.2 adicionados.
- Snapshot passa a incluir o README da versão.

## Arquitetura afetada

- `frontend/src/layout/MainListItems.js`
- `backend/src/controllers/VersionController.ts`
- metadados npm de frontend e backend;
- documentação e script de release.

## Banco de dados

Nenhuma migration. A versão exibida deixa de depender da tabela histórica de versões.

## Multiempresa

Sem alteração de dados de tenant. A versão é global para toda a implantação.

## Testes executados

- Build TypeScript do backend: aprovado.
- Build de produção do frontend: aprovado, com avisos legados.
- Imagens Docker de backend e frontend: geradas.
- Containers de backend e frontend: recriados e ativos.
- Endpoint local e público `/version`: responde `1.3`.
- Frontend local e público: responde HTTP 200.
- Bundle implantado: contém os metadados da versão `1.3`.

## Limitações

- A versão 1.3 ainda não é um snapshot pronto.
- O snapshot será criado somente quando o usuário declarar a versão pronta.
- O frontend ainda possui avisos legados de lint, bundle grande e dependências vulneráveis; a correção exige lotes próprios para evitar regressões.
