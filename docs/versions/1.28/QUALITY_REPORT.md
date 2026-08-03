# Relatório de qualidade — 1.28

Estado: publicada.

- build TypeScript isolado aprovado;
- gate completo: 52 suítes/197 testes aprovados;
- backend e frontend compilados em imagens reproduzíveis;
- restore PostgreSQL 16 e cadeia das migrations up/down/up em 232/162/255 ms;
- concorrência de início e confirmação: 1/0 em ambos os ensaios;
- backup pré-migration verificado por SHA-256 e modo 0600;
- produção: migrations estado/FK/índice em 162/51/57 ms; schema, índice coberto e FK CASCADE
  verificados;
- runtime transacional: início 1/0, confirmação 1/0 e zero linhas após rollback;
- API 1.28, frontend 200, smoke e restart aprovados;
- shutdown: seis filas, zero falhas, 557 ms.

Não houve tuning de cache, pool ou PostgreSQL: o baseline não mostrou carga que
o justificasse. Não foi realizado envio WhatsApp real.
