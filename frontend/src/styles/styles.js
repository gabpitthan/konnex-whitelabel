/**
 * Ponte entre o código legado e os tokens do design system (ADR-0004).
 *
 * Este arquivo era uma **segunda paleta**, hardcoded e paralela ao tema:
 * `colorBackgroundTable()` devolvia `#2a273b` (roxo escuro) e `colorPrimary()`
 * devolvia `#0000FF` (azul puro). Por isso o construtor de fluxos e as páginas
 * de campanha apareciam com fundo escuro e azul saturado mesmo depois do
 * redesign — elas nunca liam o tema.
 *
 * As funções foram mantidas porque cinco arquivos as importam; o que mudou é
 * que agora devolvem custom properties. Assim as telas passam a acompanhar
 * claro/escuro sem precisar reescrever cada chamada.
 *
 * Não adicionar funções novas aqui. Código novo consome os tokens direto.
 */

export const colorBack = () => "var(--brand-base)";

export const colorPrimary = () => "var(--brand-base)";

export const colorIconesMenu = () => "var(--text-secondary)";

export const colorTitleTable = () => "var(--text-muted)";

// Usado como cor de TEXTO no cabeçalho da tabela, não como fundo.
export const colorTopTable = () => "var(--text-muted)";

export const colorBackgroundTable = () => "var(--surface-raised)";

// Usado como fundo da linha selecionada.
export const colorLineTable = () => "var(--surface-selected)";

export const colorLineTableHover = () => "var(--surface-hover)";

export const colorTopbar = () => "var(--surface-raised)";
