/**
 * Validação de segredos no boot. Falha fechado.
 *
 * Este produto é instalado por terceiros a partir de um `.env` com dezenas de
 * variáveis. A chance de alguém esquecer uma é alta, e o código herdado tinha
 * um valor embutido para cada segredo — `JWT_SECRET || "mysecret"` entre eles.
 *
 * O efeito de esquecer o segredo do JWT não é uma falha visível: a aplicação
 * sobe normal, o login funciona, e qualquer pessoa que conheça o valor padrão
 * (público, porque o código deriva de projeto aberto) assina um token válido
 * para qualquer usuário de qualquer empresa. Autenticação inteira contornada,
 * em silêncio.
 *
 * Por isso a ausência passa a impedir o boot em vez de virar um padrão. Uma
 * instalação que não sobe é um chamado de suporte; uma instalação que sobe
 * insegura é um incidente que ninguém percebe.
 */

interface SegredoObrigatorio {
  nome: string;
  motivo: string;
  /** Valores herdados do código aberto: públicos, portanto inaceitáveis. */
  proibidos?: string[];
  /** Tamanho mínimo em caracteres, quando faz sentido exigir entropia. */
  minimo?: number;
}

const OBRIGATORIOS: SegredoObrigatorio[] = [
  {
    nome: "JWT_SECRET",
    motivo:
      "assina os tokens de sessão; com o valor padrão qualquer pessoa forja acesso a qualquer empresa",
    proibidos: ["mysecret", "secret", "changeme", "CHANGE_ME"],
    minimo: 32
  },
  {
    nome: "JWT_REFRESH_SECRET",
    motivo: "assina os tokens de renovação de sessão",
    proibidos: ["myanothersecret", "secret", "changeme", "CHANGE_ME"],
    minimo: 32
  },
  {
    nome: "REDIS_SECRET_KEY",
    motivo: "protege o estado de sessão do WhatsApp guardado no Redis",
    proibidos: ["MULTI100", "changeme", "CHANGE_ME"],
    minimo: 16
  },
  {
    nome: "DB_PASS",
    motivo: "senha do banco de dados",
    proibidos: ["postgres", "password", "changeme", "CHANGE_ME"],
    minimo: 12
  }
];

/** Não impedem o boot, mas a instalação nasce fraca — precisa aparecer. */
const RECOMENDADOS: SegredoObrigatorio[] = [
  {
    nome: "ADMIN_PASSWORD",
    motivo: "senha do primeiro administrador criado pelo seed",
    proibidos: ["change-before-production", "admin", "123456", "CHANGE_ME"],
    minimo: 10
  },
  {
    nome: "VERIFY_TOKEN",
    motivo: "valida os webhooks de Facebook/Instagram",
    proibidos: ["whaticket", "changeme", "CHANGE_ME"]
  }
];

const avaliar = (s: SegredoObrigatorio): string | null => {
  const valor = process.env[s.nome];

  if (!valor || valor.trim() === "") {
    return `${s.nome} não está definido — ${s.motivo}`;
  }
  if (s.proibidos?.some(p => valor.toLowerCase() === p.toLowerCase())) {
    return `${s.nome} está com um valor de exemplo, que é público — ${s.motivo}`;
  }
  if (s.minimo && valor.length < s.minimo) {
    return `${s.nome} tem ${valor.length} caracteres; o mínimo é ${s.minimo} — ${s.motivo}`;
  }
  return null;
};

const comoGerar = [
  "Como gerar um segredo forte:",
  "",
  "  openssl rand -base64 48",
  "  # ou, sem openssl:",
  "  node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\"",
  "",
  "Gere um valor DIFERENTE para cada variável e coloque no arquivo .env.",
  "Nunca reaproveite segredos entre instalações."
].join("\n");

/**
 * Roda antes de a aplicação escutar na porta. Lança quando um segredo
 * obrigatório está ausente ou com valor de exemplo.
 */
export const validarSegredos = (): void => {
  const erros = OBRIGATORIOS.map(avaliar).filter((e): e is string => e !== null);
  const avisos = RECOMENDADOS.map(avaliar).filter((e): e is string => e !== null);

  if (avisos.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      ["", "ATENÇÃO — configuração fraca:", ...avisos.map(a => `  - ${a}`), ""].join("\n")
    );
  }

  if (erros.length === 0) return;

  const mensagem = [
    "",
    "=".repeat(72),
    "A APLICAÇÃO NÃO VAI SUBIR: segredos obrigatórios ausentes ou inseguros.",
    "=".repeat(72),
    "",
    ...erros.map(e => `  - ${e}`),
    "",
    comoGerar,
    "",
    "Isto é proposital. Subir com segredo de exemplo deixaria a instalação",
    "acessível a qualquer pessoa que conheça o valor padrão, sem nenhum sinal",
    "de que algo está errado.",
    "=".repeat(72),
    ""
  ].join("\n");

  // eslint-disable-next-line no-console
  console.error(mensagem);
  throw new Error("Segredos obrigatórios ausentes ou inseguros — boot abortado");
};

export default validarSegredos;
