# Relatório de qualidade — versão 1.17

Data: 2026-07-29  
Resultado: publicada

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| identidade imutável | contexto criado pelo middleware | testes Bearer/contexto |
| isolamento de conexão | lookup `id + companyId + channel` | revisão e build |
| token único | índice parcial + validação create/update | migration up/down/up |
| consumo sem perda | `INSERT ... ON CONFLICT DO UPDATE` | teste SQL/incrementos |
| falha visível | contabilização aguardada | ausência de timer no fluxo |

## Gates

- backup binário: modo 600 e checksum registrado;
- restore: 57 tabelas;
- migration em restore: up 39 ms, down 31 ms, segundo up 56 ms;
- preflight: aprovado;
- testes: 21 suítes, 81 testes, zero falhas;
- builds Docker: aprovados;
- produção: migration 113 ms;
- schema: dois índices parciais esperados e migration registrada uma vez;
- runtime: API 1.17 e resposta 401 sem Bearer;
- restart: desligamento limpo em 2 ms e retorno da API 1.17.

## Riscos residuais

Token em digest com rotação, rate limit por credencial e teste positivo com
cliente canário ainda não foram entregues. O teste negativo não usou nem exibiu
o token real.
