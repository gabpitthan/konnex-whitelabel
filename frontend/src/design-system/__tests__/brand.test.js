import { resolveBrand, readableOn, contrastRatio, isValidHexColor } from "../brand";
import { themes } from "../tokens";

/**
 * O produto é whitelabel: se a cor do tenant não chegar ao tema, a tela do
 * cliente fica com a marca do fornecedor. Foi o que aconteceu quando o tema do
 * Material UI passou a ler dos tokens, e é o que estes testes impedem de voltar.
 */

describe("resolveBrand", () => {
  it("usa os tokens quando o tenant não configurou cor", () => {
    ["", null, undefined, "   ", "nao-e-cor", "#12", "rgb(1,2,3)"].forEach(value => {
      const brand = resolveBrand("light", value);
      expect(brand.isTenant).toBe(false);
      expect(brand.base).toBe(themes.light["brand-base"]);
      expect(brand.hover).toBe(themes.light["brand-hover"]);
      expect(brand.onBrand).toBe(themes.light["on-brand"]);
    });
  });

  it("aceita a cor do tenant com e sem cerquilha, e a forma curta", () => {
    expect(resolveBrand("light", "#16856F").base).toBe("#16856F");
    expect(resolveBrand("light", "16856F").base).toBe("#16856F");
    expect(resolveBrand("light", "#0A0").base).toBe("#0A0");
  });

  it("deriva hover e active da cor do tenant, nunca do token", () => {
    const brand = resolveBrand("light", "#16856F");
    expect(brand.hover).not.toBe(themes.light["brand-hover"]);
    expect(brand.active).not.toBe(themes.light["brand-active"]);
    // No tema claro o hover escurece: precisa ficar mais escuro que a base.
    expect(contrastRatio(brand.hover, "#FFFFFF")).toBeGreaterThan(
      contrastRatio(brand.base, "#FFFFFF")
    );
  });

  it("clareia no tema escuro em vez de escurecer", () => {
    const brand = resolveBrand("dark", "#16856F");
    expect(contrastRatio(brand.hover, "#000000")).toBeGreaterThan(
      contrastRatio(brand.base, "#000000")
    );
  });

  // O ponto do lote: uma marca clara com texto branco deixa o rótulo do botão
  // ilegível. O texto é escolhido por contraste medido, não por suposição.
  it("escolhe o texto da marca por contraste, atingindo 4.5:1", () => {
    ["#16856F", "#F5D90A", "#00E5FF", "#111111", "#FFFFFF", "#1573E1"].forEach(color => {
      const brand = resolveBrand("light", color);
      expect(contrastRatio(brand.onBrand, brand.base)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("prefere branco sobre marca escura e escuro sobre marca clara", () => {
    expect(readableOn("#111827")).toBe("#FFFFFF");
    expect(readableOn("#F5D90A")).toBe("#111827");
  });
});

describe("isValidHexColor", () => {
  it("aceita apenas hex de 3 ou 6 dígitos", () => {
    expect(isValidHexColor("#abc")).toBe(true);
    expect(isValidHexColor("abcdef")).toBe(true);
    expect(isValidHexColor("#abcd")).toBe(false);
    expect(isValidHexColor("#ggghhh")).toBe(false);
    expect(isValidHexColor(123456)).toBe(false);
  });
});
