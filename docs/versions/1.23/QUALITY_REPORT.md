# Relatório de qualidade — versão 1.23

Data: 2026-08-01
Resultado: publicada

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| mount único | removida duplicata de mensagens | contrato estático + regressão |
| superfície mínima | removido webhook na raiz | inventário + runtime 404 |
| compatibilidade | preservado `/webhook` | runtime 403 com token inválido |
| proteção | mensagens continuam sob auth | Bearer inválido retornou 403 |

## Gates

- preflight: aprovado;
- testes: 36 suítes/118 testes;
- contrato de rotas: 1 suíte/2 testes;
- builds Docker backend/frontend: aprovados;
- API 1.23/frontend 200: saudáveis;
- backend/frontend: containers saudáveis após rollout;
- schema: nenhuma migration necessária.

## Conclusão

A composição Express agora possui um único caminho por contrato. A mudança
reduz travessia inútil e superfície pública sem alterar consumidores canônicos.
Os passivos npm e o bundle de 1,68 MB permanecem em trilhas próprias porque
upgrades forçados nesta entrega aumentariam o risco de incompatibilidade.
