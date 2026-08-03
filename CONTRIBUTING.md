# Como contribuir

Obrigado por ajudar a evoluir o Konnex Whitelabel. Contribuições devem preservar
isolamento multiempresa, integridade do banco e operação segura antes de ampliar
funcionalidades.

## Antes de começar

1. Pesquise issues e pull requests existentes.
2. Para mudanças relevantes, abra uma issue descrevendo problema, impacto e
   evidência; não publique dados reais.
3. Leia `AGENTS.md`, `docs/DEVELOPMENT_WORKFLOW.md`,
   `docs/DEFINITION_OF_DONE.md` e `docs/project/CURRENT.md`.
4. Baseie tuning, cache ou índices em medição reproduzível, não em suposição.

## Desenvolvimento

Crie uma branch curta a partir de `main`. Mantenha commits pequenos, com verbo
no imperativo e uma única intenção observável.

Requisitos mínimos:

- toda consulta/mutação multiempresa inclui `companyId`;
- efeitos externos são idempotentes ou explicitamente reconciliáveis;
- emissão de eventos ocorre após commit;
- migrations possuem rollback seguro e teste de contrato;
- nenhum segredo, PII, dump, upload ou log entra no Git;
- mudanças visuais funcionam em desktop e mobile;
- documentação e versão são sincronizadas quando o lote funcional fecha.

## Validação

```bash
scripts/preflight.sh
scripts/quality-gate.sh
```

Inclua no pull request os testes executados, evidências de runtime, impacto em
PostgreSQL/Redis, riscos, rollback e limitações ainda abertas. Um teste unitário
estreito não prova uma afirmação operacional ampla.

## Pull requests

O PR deve explicar:

- problema e causa;
- decisão e alternativas consideradas;
- impacto em tenant, concorrência, desempenho, cache e produção;
- como foi verificado;
- como reverter.

Ao contribuir, você declara possuir direito de enviar o código. A aceitação de
uma contribuição não cria uma licença geral para o restante do projeto.

