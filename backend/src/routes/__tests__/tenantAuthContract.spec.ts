import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

/**
 * Contrato de autenticação e isolamento por tenant.
 *
 * Motivo de existir: em 2026-08-07, `/dashboard/ticketsUsers` e
 * `/dashboard/ticketsDay` estavam sem `isAuth` — o middleware estava importado
 * no arquivo e aplicado nas outras duas rotas do mesmo router. Somado a
 * `companyId` lido de `req.query`, qualquer pessoa na internet lia nome de
 * usuário e volume de atendimento de qualquer empresa, sem token:
 *
 *   GET /dashboard/ticketsUsers?companyId=1  ->  200 {"data":[{"nome":"Admin"}]}
 *
 * Uma rota nova sem autenticação não quebra nenhum teste e não gera erro: ela
 * simplesmente responde. Por isso o contrato é declarativo — rota pública é
 * decisão consciente que se registra aqui, e o que não estiver na lista
 * reprova.
 */

const ROUTES_DIR = resolve(__dirname, "..");
const CONTROLLERS_DIR = resolve(__dirname, "../../controllers");

const AUTH_MIDDLEWARE =
  /\b(isAuth|isAuthCompany|isAuthApi|tokenAuth|envTokenAuth)\b/;

/**
 * Rotas propositalmente públicas. Cada entrada é uma decisão de segurança:
 * acrescentar aqui exige saber que a rota responde para a internet inteira.
 */
const PUBLICAS_POR_DESIGN = new Set([
  "/signup",
  "/login",
  "/refresh_token",
  "/forgot-password",
  "/reset-password",
  "/health/live",
  "/health/ready",
  "/version",
  "/plans/list",
  "/public-settings/:settingKey",
  "/settings/userCreation",
  "/client-errors",
  "/subscription/create/webhook",
  "/subscription/webhook/:type?",
  // Webhooks de provedor externo: montados em /webhook, autenticados pela
  // verificação do próprio provedor, não por sessão de usuário.
  "/"
]);

const arquivosDeRota = (): string[] => {
  const resultado: string[] = [];
  const visita = (dir: string) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const caminho = join(dir, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name !== "__tests__") visita(caminho);
      } else if (entrada.name.endsWith(".ts")) {
        resultado.push(caminho);
      }
    }
  };
  visita(ROUTES_DIR);
  return resultado;
};

/** Extrai cada chamada .get/.post/... inteira, mesmo quebrada em várias linhas. */
const declaracoesDeRota = (
  fonte: string
): { metodo: string; caminho: string; corpo: string }[] => {
  const encontradas: { metodo: string; caminho: string; corpo: string }[] = [];
  const inicio = /\.(get|post|put|delete|patch)\s*\(/g;
  let m: RegExpExecArray | null;

  while ((m = inicio.exec(fonte)) !== null) {
    let i = m.index + m[0].length;
    let profundidade = 1;
    while (i < fonte.length && profundidade > 0) {
      if (fonte[i] === "(") profundidade += 1;
      else if (fonte[i] === ")") profundidade -= 1;
      i += 1;
    }
    const corpo = fonte.slice(m.index, i);
    const caminho = corpo.match(/["'`]([^"'`]*)["'`]/);
    encontradas.push({
      metodo: m[1],
      caminho: caminho ? caminho[1] : "?",
      corpo
    });
  }
  return encontradas;
};

describe("contrato de autenticação das rotas", () => {
  it("toda rota exige autenticação, salvo as públicas declaradas", () => {
    const desprotegidas: string[] = [];

    for (const arquivo of arquivosDeRota()) {
      const fonte = readFileSync(arquivo, "utf8");
      for (const rota of declaracoesDeRota(fonte)) {
        if (AUTH_MIDDLEWARE.test(rota.corpo)) continue;
        if (PUBLICAS_POR_DESIGN.has(rota.caminho)) continue;
        desprotegidas.push(
          `${arquivo.split("/routes/")[1]}  ${rota.metodo.toUpperCase()} ${rota.caminho}`
        );
      }
    }

    expect(desprotegidas).toEqual([]);
  });

  it("as rotas de relatório do dashboard exigem autenticação", () => {
    const fonte = readFileSync(join(ROUTES_DIR, "dashboardRoutes.ts"), "utf8");
    for (const rota of declaracoesDeRota(fonte)) {
      expect(rota.corpo).toMatch(/isAuth/);
    }
  });
});

describe("contrato de origem do tenant", () => {
  /**
   * O identificador da empresa vem do token assinado. Aceitá-lo do cliente
   * transforma qualquer usuário autenticado — ou anônimo, quando a rota também
   * está aberta — em leitor de dados de outro tenant.
   */
  it("nenhum controller lê companyId de req.query ou req.body", () => {
    const infratores: string[] = [];

    const visita = (dir: string) => {
      for (const entrada of readdirSync(dir, { withFileTypes: true })) {
        const caminho = join(dir, entrada.name);
        if (entrada.isDirectory()) {
          if (entrada.name !== "__tests__") visita(caminho);
          continue;
        }
        if (!entrada.name.endsWith(".ts")) continue;

        const fonte = readFileSync(caminho, "utf8");
        fonte.split("\n").forEach((linha, indice) => {
          if (/companyId\s*[},][^=]*=\s*req\.(query|body)/.test(linha) ||
              /const\s*{\s*companyId\s*}\s*=\s*req\.(query|body)/.test(linha)) {
            infratores.push(
              `${caminho.split("/controllers/")[1]}:${indice + 1}  ${linha.trim()}`
            );
          }
        });
      }
    };
    visita(CONTROLLERS_DIR);

    expect(infratores).toEqual([]);
  });
});
