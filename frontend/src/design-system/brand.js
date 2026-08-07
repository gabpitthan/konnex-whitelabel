import { themes } from "./tokens";

/**
 * Resolve a escala de marca considerando a cor escolhida pelo tenant.
 *
 * O produto é whitelabel: cada cliente configura a própria cor em
 * Configurações. Quando o tema do Material UI passou a ler dos tokens, essa cor
 * deixou de alcançar `palette.primary` e passou a existir só como custom
 * property — ou seja, deixou de pintar botão, aba, link e ícone, que é
 * praticamente toda a aplicação. Este módulo devolve a cor do tenant ao tema
 * sem reabrir a divergência de paleta que o design system veio fechar: só a
 * marca é substituída, os sinais de conexão, entrega e falha permanecem
 * constantes porque são semântica de produto, não identidade de cliente.
 *
 * `hover` e `active` são derivados, e não fixos: manter o azul do token como
 * hover de um botão verde de tenant é o tipo de detalhe que faz a interface
 * parecer improvisada.
 */

const hexToRgb = hex => {
  const clean = String(hex).replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map(c => c + c)
          .join("")
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16)
  ];
};

const toHex = ([r, g, b]) =>
  `#${[r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")}`;

export const isValidHexColor = value =>
  typeof value === "string" && /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

/** Luminância relativa da WCAG 2.1. */
const luminance = hex => {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

/** Mistura em direção ao preto (amount < 0) ou ao branco (amount > 0). */
const shade = (hex, amount) => {
  const target = amount < 0 ? 0 : 255;
  const ratio = Math.abs(amount);
  return toHex(hexToRgb(hex).map(v => v + (target - v) * ratio));
};

/**
 * Texto legível sobre a cor de marca. Escolhido por contraste medido, não por
 * suposição: com uma marca clara — amarelo, lima, ciano — texto branco cai bem
 * abaixo de 4.5:1 e o rótulo do botão some.
 */
export const readableOn = background =>
  contrastRatio("#FFFFFF", background) >= contrastRatio("#111827", background)
    ? "#FFFFFF"
    : "#111827";

export const resolveBrand = (mode = "light", tenantColor) => {
  const t = themes[mode] || themes.light;

  if (!isValidHexColor(tenantColor)) {
    return {
      base: t["brand-base"],
      hover: t["brand-hover"],
      active: t["brand-active"],
      soft: t["brand-soft"],
      onBrand: t["on-brand"],
      isTenant: false
    };
  }

  const base = tenantColor.trim().startsWith("#")
    ? tenantColor.trim()
    : `#${tenantColor.trim()}`;

  // No tema escuro a marca clareia no hover; no claro, escurece. Repetir a
  // direção do tema claro no escuro deixaria o hover invisível sobre o fundo.
  const dark = mode === "dark";

  return {
    base,
    hover: shade(base, dark ? 0.12 : -0.12),
    active: shade(base, dark ? 0.24 : -0.24),
    soft: shade(base, dark ? -0.72 : 0.88),
    onBrand: readableOn(base),
    isTenant: true
  };
};

export default resolveBrand;
