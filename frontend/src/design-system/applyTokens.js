import { themes, staticTokens } from "./tokens";

/**
 * Publica os tokens como custom properties no `:root`.
 *
 * Feito em runtime, e não num .css estático, para que exista uma única fonte
 * de verdade (`tokens.js`). Um segundo arquivo com os mesmos valores acabaria
 * divergindo — foi exatamente esse tipo de divergência que deixou o redesign
 * anterior incoerente entre telas.
 */
export const applyTokens = (mode = "light") => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const theme = themes[mode] || themes.light;

  Object.entries(staticTokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Permite seletores CSS por tema sem depender de classe em cada componente.
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
};

export default applyTokens;
