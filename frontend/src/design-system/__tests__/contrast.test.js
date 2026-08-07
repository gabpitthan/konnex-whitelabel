import { themes } from "../tokens";

/**
 * Contraste é critério de aceite do design system, não revisão manual.
 *
 * Sem este teste, "acessível" vira opinião e regride na primeira cor ajustada
 * a olho. Os pares aqui são os que carregam informação: texto sobre superfície
 * e rótulo de status sobre seu fundo.
 */

const hexToRgb = (hex) => {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

// WCAG 2.1 relative luminance.
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

// Pares que precisam de 4.5:1 (texto normal, WCAG AA).
const textPairs = [
  ["text-primary", "surface-page"],
  ["text-primary", "surface-raised"],
  ["text-secondary", "surface-page"],
  ["text-secondary", "surface-raised"],
  ["on-brand", "brand-base"],
  ["signal-live-text", "signal-live-soft"],
  ["signal-wait-text", "signal-wait-soft"],
  ["signal-fail-text", "signal-fail-soft"],
  ["signal-info-text", "signal-info-soft"],
];

// Pares que precisam de 3:1 (WCAG 1.4.11, componentes de UI).
// `border-default` fica de fora de propósito: separa superfícies e é
// decorativo. Quem delimita controle operável é `border-input`, e é esse que
// precisa ser percebido.
const uiPairs = [
  ["border-input", "surface-raised"],
  ["border-focus", "surface-page"],
  ["signal-live", "surface-raised"],
  ["signal-fail", "surface-raised"],
];

describe.each(["light", "dark"])("contraste no tema %s", (mode) => {
  const t = themes[mode];

  test.each(textPairs)("%s sobre %s atinge 4.5:1", (fg, bg) => {
    const r = ratio(t[fg], t[bg]);
    expect({ pair: `${fg}/${bg}`, ratio: Number(r.toFixed(2)) }).toEqual({
      pair: `${fg}/${bg}`,
      ratio: expect.any(Number),
    });
    expect(r).toBeGreaterThanOrEqual(4.5);
  });

  test.each(uiPairs)("%s sobre %s atinge 3:1", (fg, bg) => {
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(3);
  });

  test("texto-muted permanece legível a 4.5:1 sobre a superfície elevada", () => {
    expect(ratio(t["text-muted"], t["surface-raised"])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("integridade dos tokens", () => {
  test("light e dark declaram exatamente as mesmas chaves", () => {
    expect(Object.keys(themes.light).sort()).toEqual(Object.keys(themes.dark).sort());
  });

  test("toda cor e um hex valido, exceto o par HSL da sombra", () => {
    Object.entries(themes).forEach(([mode, tokens]) => {
      Object.entries(tokens).forEach(([key, value]) => {
        if (key === "shadow-color") return;
        expect(`${mode}.${key}=${value}`).toMatch(/=#[0-9a-fA-F]{6}$/);
      });
    });
  });
});
