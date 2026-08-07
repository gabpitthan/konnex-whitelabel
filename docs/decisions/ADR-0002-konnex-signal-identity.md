# ADR-0002 — Identidade Konnex Signal

Data: 2026-07-28  
Estado: **substituído em 2026-08-07 pelo ADR-0004**

> **Este ADR não vale mais.** A identidade Konnex Signal foi descontinuada por
> decisão de Gabriel em 2026-08-07: duas tentativas de aplicá-la (1.5 e 1.6)
> produziram resultado parcial e foram rejeitadas. A identidade passou a ser
> derivada da skill `ui-ux-pro-max`. Ver `ADR-0004-identidade-ui-ux.md`.
>
> As restrições de engenharia deste ADR (não misturar migração MUI com
> redesign, não considerar página pronta sem os três breakpoints, não alterar
> regra de negócio durante mudança visual) **sobrevivem** e foram reescritas no
> ADR-0004 — são lições de execução, não preferência estética.

## Decisão (histórica)

Adotar **Konnex Signal** como identidade visual oficial da aplicação.

## Princípios

- originalidade pela composição e comportamento, não por decoração;
- hierarquia editorial e densidade operacional;
- sinais de conexão, atividade, atenção e falha;
- superfícies neutras, bordas discretas e sombras apenas para elevação real;
- responsividade pensada desde o componente;
- design system único para todas as áreas;
- whitelabel controlado por tokens seguros.

## Restrições

- não alterar regras de negócio durante a migração visual;
- evitar aparência genérica de template ou frontend de IA;
- não migrar MUI v4 para v5 no mesmo lote do redesign;
- não considerar uma página pronta sem desktop, tablet e mobile.
