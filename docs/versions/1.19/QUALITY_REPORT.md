# Relatório de qualidade — versão 1.19

Data: 2026-07-30  
Resultado: publicada

## Requisito → mudança → prova

| Requisito | Mudança | Prova |
|---|---|---|
| entropia | 32 bytes CSPRNG no backend | 100 tokens válidos/únicos |
| escopo | rotação por id+tenant+canal e admin | testes owner/404 |
| revelação única | segredo só em create/rotate | GET/list runtime sem token |
| update seguro | token removido do update comum | revisão estática/build |
| upload seguro | usa `req.apiConnection.companyId` | revisão e build |
| lista tenant-aware | `/whatsapp/all` filtra empresa | teste e runtime count |

## Gates

- preflight: aprovado;
- testes: 26 suítes, 90 testes, zero falhas;
- builds Docker: aprovados;
- schema: sem migration;
- runtime: API/frontend 1.19;
- respostas autenticadas: lista/detalhe sem chave token;
- restart: shutdown em 1 ms, sem migration pendente.

## Limites

O token ainda é plaintext no banco e a rotação revoga imediatamente o anterior.
A próxima fase adicionará digest com pepper, janela dual e auditoria. O endpoint
de rotação não foi chamado em produção para não interromper o cliente real.
