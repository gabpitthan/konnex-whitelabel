# Política de segurança

## Relatar uma vulnerabilidade

Não abra issue pública para vulnerabilidades. Use **Security → Report a
vulnerability** neste repositório. Inclua somente o mínimo necessário:

- componente e versão afetados;
- pré-condições e impacto;
- passos reproduzíveis com dados sintéticos;
- sugestão de correção, se houver.

Nunca envie tokens, sessões WhatsApp, números reais, mensagens, dumps ou chaves
privadas. O mantenedor fará triagem e coordenará divulgação/correção conforme a
severidade; não há SLA público formal neste momento.

## Escopo prioritário

- quebra de isolamento entre empresas;
- bypass de autenticação/autorização;
- execução remota, SSRF ou acesso a redes internas;
- exposição de credenciais, mensagens ou auth state;
- duplicação/perda silenciosa de efeitos externos;
- corrupção de integridade no PostgreSQL ou Redis.

## Versões suportadas

Somente a versão publicada mais recente na branch `main` recebe correções. O
estado exato e as limitações conhecidas estão em `PROJECT_STATE.md` e
`docs/project/ISSUES.md`.

