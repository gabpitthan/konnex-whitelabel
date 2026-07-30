# Whitelabel Whaticket — versão 1.20

Data: 2026-07-30
Estado: publicada

## Objetivo

Migrar credenciais da API para digest não reversível, com compatibilidade
legada, rotação sem downtime, revogação e metadados de auditoria.

## Fontes primárias

- OWASP Secrets Management:
  https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- RFC 5869 HKDF:
  https://www.rfc-editor.org/rfc/rfc5869
- Node.js Crypto:
  https://nodejs.org/api/crypto.html
- PostgreSQL row locking:
  https://www.postgresql.org/docs/17/explicit-locking.html
- Sequelize transactions:
  https://sequelize.org/docs/v6/other-topics/transactions/

## Desenho

- token `wk_<prefixo>_<256 bits>`;
- HMAC-SHA-256 do token, nunca o segredo, persistido;
- pepper dedicado preferencial; fallback HKDF domain-separated do master;
- prefixo público indexado para lookup limitado;
- comparação de digest com `timingSafeEqual`;
- tabela aditiva com owner, status, expiração e atores;
- um único credential `active` sem expiração por conexão;
- anterior muda para `grace` por 15 minutos;
- legado é aceito até primeira rotação e então também recebe prazo;
- revogação invalida digest e legado na mesma transação;
- row lock da conexão serializa rotate/revoke.

## Rollback

Imagem 1.19. Durante o período de compatibilidade, a coluna legado permanece.
O down remove somente a tabela nova e a coluna de expiração legada.

## Limites

O contrato ainda não remove a coluna plaintext: isso ocorrerá após medir e
eliminar uso legado. `lastUsedAt` por request não será gravado sincronicamente,
evitando write amplification no banco.

## Evidência de publicação

- backup: `pre-1.20-20260730.dump`, modo `0600`;
- SHA-256:
  `004413010f41660e1db41ba950901a1c218fa9a09e3d538da53f04f42f77e236`;
- restore e migration: `up → down → up`;
- schema restaurado: tabela e coluna presentes, quatro índices;
- testes: 30 suítes e 101 testes;
- correção pós-smoke: sete testes de normalização/validação adicionais;
- builds reproduzíveis: backend e frontend aprovados;
- produção: migration em 216 ms, API 1.20 e containers saudáveis;
- auth: legado aceito e credencial inválida rejeitada com 401;
- borda: corpo sem número rejeitado com 400, sem exceção interna;
- nenhum token foi exibido, rotacionado ou revogado na validação.
