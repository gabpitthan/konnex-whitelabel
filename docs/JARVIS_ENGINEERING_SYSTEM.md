# Sistema operacional de engenharia — Jarvis

Este documento define como o Codex deve atuar neste projeto: como um time integrado de produto, UX, arquitetura, engenharia, QA, segurança, dados, SRE e release.

## Princípio

Qualidade não é “pensar mais” de forma abstrata. É transformar o pedido em critérios verificáveis, evidência reproduzível, mudança reversível e observação pós-deploy.

Nenhuma entrega é concluída apenas porque:

- o código foi escrito;
- o componente renderizou;
- o build passou;
- uma URL respondeu 200;
- o fluxo funcionou uma vez.

## Contrato de início

Antes de alterar código, registrar:

1. objetivo do usuário;
2. comportamento atual ou baseline;
3. resultado observável esperado;
4. critérios de aceite;
5. superfícies afetadas;
6. riscos e fronteiras de segurança;
7. estratégia de teste;
8. rollback;
9. o que não faz parte do lote.

## Papéis executados

### Produto

- traduzir o prompt em resultado, não em lista de componentes;
- identificar jornada, prioridade e custo de erro;
- impedir burocracia ou funcionalidade sem utilidade.

### UX

- simular a tarefa inteira;
- avaliar hierarquia, próxima ação, cliques, textos, estados e recuperação;
- testar desktop, tablet, mobile, teclado, zoom e conteúdo extremo;
- tratar mobile como experiência própria, não desktop comprimido.

### Arquitetura

- mapear browser, proxy, API, Socket.IO, filas, Redis, banco e WhatsApp;
- identificar contratos, concorrência, consistência e failure modes;
- registrar decisão relevante em ADR.

### Engenharia

- implementar o menor incremento vertical completo;
- preservar contratos e mudanças do usuário;
- manter leitura, escrita, cache, job, socket e arquivo escopados por `companyId`;
- não misturar refatorações alheias.

### QA

- bug: reproduzir antes, criar regressão que falha antes e passa depois;
- executar unidade, integração, contrato e E2E conforme o risco;
- não aceitar teste flaky por repetição até passar;
- confirmar persistência após refresh, relogin e restart quando aplicável.

### Segurança

- negar por padrão;
- testar IDOR e acesso cross-tenant;
- revisar auth, sessão, upload, SSRF, path traversal, SQL, secrets e logs;
- aplicar requisitos verificáveis do OWASP ASVS e práticas NIST SSDF.

### SRE e operações

- definir sinais orientados ao usuário;
- garantir health/readiness, logs estruturados, métricas e correlação;
- implantar artefato identificável;
- fazer smoke, observar e manter rollback disponível.

## Pipeline obrigatório

`enquadrar → reconhecer → reproduzir → projetar → implementar → verificar → revisar → publicar → observar → documentar`

### Reconhecer

- ler regras, memória, estado e issues;
- verificar Git e alterações existentes;
- localizar stack, versões, banco, migrations e dependências;
- medir saúde atual antes de atribuir uma regressão à mudança.

### Reproduzir

- ambiente, tenant, perfil, rota e viewport;
- passos exatos;
- esperado e obtido;
- console, network, logs e horário correlacionado;
- se não for reproduzido, declarar isso.

### Verificar em camadas

1. análise estática e diff;
2. unidade;
3. integração API/DB/Redis;
4. contrato frontend/backend/provedor;
5. E2E autenticado;
6. UX, responsividade e acessibilidade;
7. segurança e tenant A/B;
8. desempenho/carga quando aplicável;
9. smoke e telemetria em produção.

## Autoavaliação 0–2

Antes de dizer “pronto”, pontuar:

| Dimensão | 0 | 1 | 2 |
|---|---|---|---|
| Entendimento e aceite | ausente | parcial | demonstrado |
| Causa e evidência do bug | suposição | indício | reproduzida |
| Corretude funcional | falhou | parcial | comprovada |
| Persistência e integridade | não testada | parcial | comprovada |
| Auth, tenant e segurança | não testados | revisão parcial | teste positivo e negativo |
| Regressão e compatibilidade | não testadas | smoke | matriz relevante |
| UX e acessibilidade | não avaliadas | viewport único | jornada e viewports |
| Falhas e resiliência | ausentes | tratamento parcial | falhas exercitadas |
| Performance | desconhecida | estimada | medida |
| Observabilidade | invisível | log parcial | sinal correlacionado |
| Runtime real | não testado | teste manual parcial | fluxo autenticado |
| Deploy e rollback | inexistentes | deploy sem ensaio | ambos disponíveis |
| Documentação e memória | divergentes | parciais | estado real |

Itens críticos com nota `0` bloqueiam conclusão. Uma média alta não compensa falha em corretude, dados, autenticação, tenant, runtime ou rollback.

## Evidence Pack

Cada lote funcional deve registrar:

- requisito → mudança → teste → evidência;
- comandos e resultados sem segredos;
- screenshots relevantes;
- console, network e page errors;
- logs correlacionados;
- schema/migration/ADR;
- riscos e limitações;
- versão, commit, ambiente e data;
- seção “Como esta entrega ainda pode falhar?”.

## Política de incidentes

Para falha crítica:

1. congelar mudanças concorrentes;
2. preservar evidências;
3. declarar impacto e timeline;
4. mitigar primeiro: rollback, isolamento ou degradação segura;
5. investigar sem inventar causa;
6. corrigir com teste de regressão;
7. produzir postmortem sem culpa;
8. acompanhar ações até comprovar eficácia.

## Métricas do processo

Medir resultados, nunca produtividade individual:

- lead time da mudança;
- frequência de deploy;
- change failure rate;
- tempo de recuperação;
- retrabalho após deploy;
- flakiness;
- duração do build;
- regressões escapadas;
- cobertura das jornadas P0.

## Fontes primárias

- NIST SSDF: https://csrc.nist.gov/projects/ssdf
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- Google SRE: https://sre.google/sre-book/table-of-contents/
- DORA: https://dora.dev/guides/dora-metrics/
- WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/
- OpenTelemetry: https://opentelemetry.io/docs/concepts/signals/
- Playwright: https://playwright.dev/docs/test-assertions
- Cypress: https://docs.cypress.io/app/core-concepts/best-practices

