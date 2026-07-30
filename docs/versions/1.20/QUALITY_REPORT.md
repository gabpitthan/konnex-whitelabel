# Relatório de qualidade — versão 1.20

Data: 2026-07-30
Resultado: publicada

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| segredo não reversível | HMAC-SHA-256 com pepper | testes crypto e schema |
| lookup escalável | prefixo indexado limita candidatos | teste resolver e quatro índices |
| comparação segura | `timingSafeEqual` | testes match/mismatch |
| rotação sem downtime | status `grace` por 15 minutos | testes rotate |
| consistência | row lock e transação | testes rotate/revoke |
| revogação | digest e legado invalidados juntos | testes revoke |
| recuperação | migration aditiva e reversível | restore/up/down/up |
| entrada externa | normalização e validação antes de uso | 7 testes + runtime 400 |

## Gates

- preflight: aprovado;
- testes focados: 6 suítes/21 testes;
- regressão: 30 suítes/101 testes;
- correção pós-smoke: 1 suíte/7 testes adicionais;
- builds Docker backend/frontend: aprovados;
- backup: formato custom, modo `0600`, SHA-256 registrado;
- migration restaurada: tabela, coluna e quatro índices;
- produção: migration em 216 ms, API 1.20, containers saudáveis;
- runtime: legado passou pelo middleware, corpo inválido retornou 400 e
  credencial inválida retornou 401.

## Desempenho e integridade

O caminho novo faz lookup pelo prefixo de 64 bits antes do HMAC e não grava
`lastUsedAt` a cada request, evitando scan e write amplification. Emissão,
rotação e revogação são raras e transacionais; autenticação permanece read-only.
O índice parcial garante um único credential atual por conexão.

## Limites

A única credencial existente continua no caminho legado até rotação controlada.
Por segurança operacional, o teste não enviou mensagem nem alterou esse token.
Dependências antigas e o bundle de 1,68 MB exigem lotes próprios, pois upgrades
automáticos neste lote ampliariam risco e rollback.
