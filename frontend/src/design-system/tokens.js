/**
 * Fonte única de verdade visual do CRM (ADR-0004).
 *
 * Direção: ferramenta de trabalho, não landing page. 90–95% neutro, a cor de
 * marca reservada para ação, seleção, foco e estado ativo — nunca decoração.
 * Referências de qualidade: Linear, Stripe Dashboard, Vercel, Attio.
 *
 * Por que JS e não só CSS: o frontend tem Material UI v4 em 211 arquivos e o
 * tema é criado com `createTheme`. Se os tokens vivessem só em CSS, o tema v4
 * repetiria os valores em JS e telas migradas divergiriam das não migradas.
 * Aqui os valores nascem uma vez; `applyTokens` publica como custom properties
 * e `muiThemeFromTokens` alimenta o tema v4.
 *
 * Todos os pares que carregam informação são verificados por
 * `__tests__/contrast.test.js`. Sete valores da paleta original de referência
 * reprovavam em WCAG AA e foram recalculados — as notas marcam quais.
 */

/* ------------------------------------------------------------- tema claro -- */

const light = {
  // Superfícies. O fundo é levemente frio e o conteúdo é branco, para a área
  // principal ler como uma superfície contínua em vez de uma pilha de cards.
  "surface-page": "#F7F8FA",
  "surface-raised": "#FFFFFF",
  "surface-subtle": "#FAFBFC",
  "surface-sunken": "#F3F5F7",
  "surface-hover": "#EEF1F4",
  "surface-selected": "#EAF3FF",
  "surface-overlay": "#FFFFFF",

  "text-primary": "#111827",
  "text-secondary": "#5F6877",
  "text-muted": "#6B737F", // era #8A94A3: media 3.07:1, reprovava em AA
  "text-disabled": "#B3BAC5",
  "text-inverse": "#FFFFFF",
  "text-brand": "#146DD4", // variante legível sobre superfície de marca

  "border-subtle": "#EEF0F3",
  "border-default": "#E6E9EE",
  "border-strong": "#91959A", // era #D8DDE5: 1.36:1, invisível como controle
  // #D8DDE5 media 1.36:1 e sumia como delimitador de campo (WCAG 1.4.11)
  "border-input": "#90959D",
  "border-focus": "#1573E1",

  // #1677E8 com texto branco media 4.34:1; escurecido o mínimo para AA
  "brand-base": "#1573E1",
  "brand-hover": "#1168CE",
  "brand-active": "#0E59B5",
  "brand-soft": "#EAF3FF",
  "on-brand": "#FFFFFF",

  // Sinais. Cada um tem base (preenchimento), soft (fundo de badge) e text
  // (texto legível sobre o soft) — a base sozinha nunca atinge 4.5:1 no soft.
  "signal-live": "#1F9D68",
  "signal-live-soft": "#EAF8F2",
  "signal-live-text": "#197F54",
  "signal-wait": "#C88719",
  "signal-wait-soft": "#FFF7E5",
  "signal-wait-text": "#986713",
  "signal-fail": "#DC4C4C",
  "signal-fail-soft": "#FFF0F0",
  "signal-fail-text": "#C34343",
  "signal-info": "#3978D4",
  "signal-info-soft": "#EDF4FF",
  "signal-info-text": "#346EC1",

  "shadow-color": "220 30% 20%",
};

/* ------------------------------------------------------------ tema escuro -- */

// Não é inversão automática: os neutros têm viés azul próprio e os sinais
// clareiam para manter legibilidade sobre fundo profundo.
const dark = {
  "surface-page": "#0D1420",
  "surface-raised": "#121B29",
  "surface-subtle": "#172131",
  "surface-sunken": "#1C2737",
  "surface-hover": "#222F41",
  "surface-selected": "#14293F",
  "surface-overlay": "#172131",

  "text-primary": "#F3F5F7",
  "text-secondary": "#B3BDCA",
  "text-muted": "#8E99A8", // #7E8998 media 4.05:1 sobre a superfície elevada
  "text-disabled": "#5C6675",
  "text-inverse": "#0D1420",
  "text-brand": "#6BA6F0",

  "border-subtle": "#202B3B",
  "border-default": "#273344",
  "border-strong": "#4A5568",
  "border-input": "#5A677E",
  "border-focus": "#4E97F0",

  "brand-base": "#4E97F0",
  "brand-hover": "#6BA6F0",
  "brand-active": "#8CBAF5",
  "brand-soft": "#14293F",
  "on-brand": "#0D1420",

  "signal-live": "#3EB489",
  "signal-live-soft": "#10261E",
  "signal-live-text": "#5DC79E",
  "signal-wait": "#D9A03C",
  "signal-wait-soft": "#2A2114",
  "signal-wait-text": "#E3B45F",
  "signal-fail": "#E36B6B",
  "signal-fail-soft": "#2B1719",
  "signal-fail-text": "#EC8B8B",
  "signal-info": "#5C9AE0",
  "signal-info-soft": "#141F2F",
  "signal-info-text": "#83B4EA",

  "shadow-color": "220 45% 3%",
};

/* -------------------------------------------------------------- espaçamento */

// Múltiplos de 4. A escala é curta de propósito: valores arbitrários entre os
// passos foram a origem da inconsistência entre páginas.
const space = {
  "space-0": "0",
  "space-1": "2px",
  "space-2": "4px",
  "space-3": "8px",
  "space-4": "12px",
  "space-5": "16px",
  "space-6": "20px",
  "space-7": "24px",
  "space-8": "32px",
  "space-9": "40px",
  "space-10": "48px",
  "space-11": "64px",
};

/* -------------------------------------------------------------- tipografia */

const typography = {
  "font-sans":
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  "font-mono": '"SF Mono", ui-monospace, Menlo, Consolas, monospace',

  "text-2xs": "11px",
  "text-xs": "12px",
  "text-sm": "13px",
  "text-base": "14px",
  "text-md": "15px",
  "text-lg": "17px",
  "text-xl": "20px",
  "text-2xl": "24px",
  "text-3xl": "28px",
  "text-metric": "28px",

  "leading-tight": "1.25",
  "leading-normal": "1.5",
  "leading-relaxed": "1.65",

  "weight-normal": "400",
  "weight-medium": "500",
  "weight-semibold": "600",

  "tracking-tight": "-0.011em",
  "tracking-normal": "0",
  "tracking-wide": "0.04em",
};

const radius = {
  "radius-none": "0",
  "radius-sm": "4px",
  "radius-md": "6px",
  "radius-lg": "8px",
  "radius-xl": "12px",
  "radius-full": "9999px",
};

// Sombras quase imperceptíveis: elevação real vem de borda e superfície, não
// de sombra pesada.
const elevation = {
  "shadow-none": "none",
  "shadow-sm": "0 1px 2px hsl(var(--shadow-color) / 0.05)",
  "shadow-md": "0 2px 6px hsl(var(--shadow-color) / 0.07)",
  "shadow-lg": "0 8px 24px hsl(var(--shadow-color) / 0.10)",
  "shadow-xl": "0 16px 40px hsl(var(--shadow-color) / 0.14)",
  "ring-focus": "0 0 0 3px hsl(212 84% 52% / 0.18)",
};

const layers = {
  "z-base": "0",
  "z-sticky": "100",
  "z-drawer": "200",
  "z-overlay": "300",
  "z-modal": "400",
  "z-toast": "500",
  "z-tooltip": "600",
};

const motion = {
  "duration-instant": "80ms",
  "duration-fast": "120ms",
  "duration-normal": "180ms",
  "duration-slow": "240ms",
  "ease-out": "cubic-bezier(0.16, 1, 0.3, 1)",
  "ease-standard": "cubic-bezier(0.25, 0.1, 0.25, 1)",
};

const layout = {
  "control-height-sm": "30px",
  "control-height-md": "36px",
  "control-height-lg": "40px",
  "input-height": "38px",
  "row-height": "44px",
  "nav-item-height": "36px",
  "sidebar-width": "236px",
  "sidebar-width-collapsed": "68px",
  "topbar-height": "56px",
  "page-padding": "24px",
  "content-max": "1440px",
};

export const themes = { light, dark };

export const staticTokens = {
  ...space,
  ...typography,
  ...radius,
  ...elevation,
  ...layers,
  ...motion,
  ...layout,
};

export const breakpoints = { mobile: 480, tablet: 768, laptop: 1024, desktop: 1440 };

export default { themes, staticTokens, breakpoints };
