import { themes, staticTokens } from "./tokens";
import { resolveBrand } from "./brand";

/**
 * Constrói a fatia de tema do Material UI v4 a partir dos tokens.
 *
 * Existe para resolver o problema central do redesign: 211 dos 250 arquivos do
 * frontend usam MUI v4, e o tema era definido com valores próprios. Enquanto as
 * telas migram para o design system, as não migradas continuam pintando pelo
 * tema — e se os dois tiverem valores independentes, a aplicação fica com duas
 * paletas ao mesmo tempo.
 *
 * Alimentando o tema v4 daqui, uma tela ainda não migrada já herda a nova
 * identidade em cor e tipografia, mesmo sem ninguém tocar no código dela.
 */
export const muiPaletteFromTokens = (mode = "light", tenantColor) => {
  const t = themes[mode] || themes.light;
  // A cor do tenant precisa chegar ao `primary` do MUI: é ele que pinta botão,
  // aba, link e ícone nas telas ainda não migradas, ou seja, quase todas.
  const brand = resolveBrand(mode, tenantColor);

  return {
    type: mode,
    primary: { main: brand.base, contrastText: brand.onBrand },
    // `secondary` é neutro, não verde. O código legado usa `color="secondary"`
    // em dezenas de ícones de ação; apontá-lo para um sinal pintava a
    // aplicação inteira de verde e roubava o significado do sinal de conexão.
    secondary: { main: t["text-secondary"], contrastText: t["surface-raised"] },
    error: { main: t["signal-fail"] },
    warning: { main: t["signal-wait"] },
    info: { main: t["signal-info"] },
    success: { main: t["signal-live"] },
    background: {
      default: t["surface-page"],
      paper: t["surface-raised"],
    },
    text: {
      primary: t["text-primary"],
      secondary: t["text-secondary"],
      disabled: t["text-muted"],
    },
    divider: t["border-subtle"],

    // Chaves não padronizadas que o código legado consome direto do tema.
    // Mantidas para não quebrar telas ainda não migradas. Estas três eram a cor
    // do tenant antes do design system, então seguem a marca quando há tenant.
    textPrimary: brand.isTenant ? brand.base : t["text-brand"],
    borderPrimary: brand.isTenant ? brand.base : t["border-focus"],
    dark: { main: t["text-primary"] },
    light: { main: t["surface-sunken"] },
    fontColor: brand.isTenant ? brand.base : t["text-brand"],
    tabHeaderBackground: t["surface-sunken"],
    optionsBackground: t["surface-sunken"],
    fancyBackground: t["surface-page"],
    total: t["surface-raised"],
    messageIcons: t["text-muted"],
    inputBackground: t["surface-raised"],
    barraSuperior: t["surface-raised"],
  };
};

export const muiTypographyFromTokens = () => ({
  fontFamily: staticTokens["font-sans"],
  fontSize: 13,
  h1: {
    fontSize: staticTokens["text-3xl"],
    fontWeight: 700,
    letterSpacing: staticTokens["tracking-tight"],
  },
  h2: {
    fontSize: staticTokens["text-2xl"],
    fontWeight: 700,
    letterSpacing: staticTokens["tracking-tight"],
  },
  h3: { fontSize: staticTokens["text-xl"], fontWeight: 600 },
  h4: { fontSize: staticTokens["text-lg"], fontWeight: 600 },
  h5: { fontSize: staticTokens["text-md"], fontWeight: 600 },
  h6: { fontSize: staticTokens["text-base"], fontWeight: 600 },
  body1: { fontSize: staticTokens["text-base"] },
  body2: { fontSize: staticTokens["text-sm"] },
  button: { fontWeight: 600, letterSpacing: 0, textTransform: "none" },
});

export const muiShapeFromTokens = () => ({
  borderRadius: parseInt(staticTokens["radius-md"], 10),
});

export default { muiPaletteFromTokens, muiTypographyFromTokens, muiShapeFromTokens };
