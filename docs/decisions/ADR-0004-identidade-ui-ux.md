# ADR-0004 — Identidade de UI/UX derivada da skill `ui-ux-pro-max`

Data: 2026-08-07
Estado: aceito
Substitui: ADR-0002 (Konnex Signal)

## Contexto

A identidade **Konnex Signal** foi adotada no ADR-0002 e tentada duas vezes. A
versão 1.5 foi avaliada como "limpa, porém ainda estruturalmente semelhante ao
Whaticket". A navegação em duas camadas da 1.6 foi rejeitada, assim como a barra
inferior mobile. Em 2026-08-07 Gabriel declarou o resultado insuficiente:
"ainda não gostei e não alterou tudo, ficou parcial".

O problema não foi a execução de cada lote isolado — foi que a identidade
existia apenas como **princípios em prosa** (`originalidade pela composição`,
`hierarquia editorial`, `densidade operacional`). Princípios em prosa não
decidem um valor de espaçamento, uma escala tipográfica ou um par de cores. Cada
tela acabou interpretando os princípios de um jeito, e o conjunto ficou
incoerente e parcial.

## Decisão

A identidade visual passa a ser **derivada da skill `ui-ux-pro-max`**
(`~/.claude/skills/ui-ux-pro-max/`, instalada em 2026-08-07), que fornece uma
base pesquisável de 84 estilos, 192 paletas, 74 pares tipográficos, 98
diretrizes de UX e 25 tipos de gráfico, com regras de raciocínio por tipo de
produto.

O design system concreto — tokens de cor, escala tipográfica, espaçamento,
elevação, densidade, estados — será **gerado a partir da skill** e versionado no
repositório antes de qualquer tela ser alterada. A partir daí, a fonte da
verdade é o design system versionado, não a skill nem a prosa.

A consulta inicial da skill para este produto (`crm dashboard atendimento
whatsapp`) retornou: tipo **CRM & Client Management**, estilo primário **Flat
Design + Minimalism**, secundários **Soft UI Evolution** e **Micro-interactions**,
dashboard **Sales Intelligence**. Isso é ponto de partida, não decisão final —
a geração completa acontece no lote de redesign.

## Consequências

- "Konnex Signal" sai do vocabulário do projeto. Referências remanescentes em
  documentos históricos (CHANGELOG, READMEs de versão, sessões) permanecem como
  registro do que foi feito, não como direção.
- Nenhuma tela é alterada antes do design system existir versionado. Redesenhar
  tela a tela sem tokens comuns foi exatamente o que produziu o resultado
  parcial anterior.
- Cobertura é critério de aceite: um redesign "parcial" é uma falha do lote, não
  uma entrega incremental. O inventário de telas precisa ser explícito e
  fechado antes de começar.

## Restrições herdadas do ADR-0002 (continuam valendo)

- Não alterar regras de negócio, APIs, sockets, autenticação, permissões, banco
  ou rotas durante mudança visual.
- Não migrar Material UI v4 para v5 no mesmo lote do redesign. O frontend tem as
  duas versões coexistindo; misturar as duas mudanças torna qualquer regressão
  impossível de atribuir.
- Nenhuma tela é considerada pronta sem desktop, tablet e mobile verificados.
- Rolagem e ações inacessíveis são regressão crítica e bloqueiam a expansão
  visual.
- Tela branca deve sempre ter fallback recuperável e gerar erro observável no
  backend.
