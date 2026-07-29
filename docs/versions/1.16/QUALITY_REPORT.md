# Relatório de qualidade — versão 1.16

Data: 2026-07-29  
Resultado: publicada, cluster ainda bloqueado

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| Contact idempotente | unique/model `companyId+number` + findOrCreate | teste create/update/tenant |
| Ticket ativo único | índice único parcial | restore, down/up e schema runtime |
| owner atual | row lock da conexão pelo fence | teste contexto owner divergente |
| não lidas sem perda | `Ticket.increment` sob transaction | teste de lock/increment |
| cache não autoritativo | Redis apenas após commit | revisão estática e fallback |
| efeitos após commit | Contact Socket.IO em afterCommit | teste antes/depois do callback |

## Gates

- backup binário: criado, modo 600 e checksum registrado;
- restore: 57 tabelas;
- migration em restore: up 28 ms, down 21 ms, segundo up 45 ms;
- preflight: aprovado;
- testes: 18 suítes, 62 testes, zero falhas;
- builds Docker: aprovados;
- produção: migration 77 ms;
- schema: índice parcial esperado;
- dados: zero duplicidades após deploy;
- runtime: API 1.16, smoke antes/depois do restart;
- shutdown: 1 ms.

## Limites

Nenhuma mensagem real foi recebida porque não há conta canário disponível.
Frontend não mudou e o gate de navegador não foi repetido. Dívidas npm e bundle
permanecem no baseline documentado.
