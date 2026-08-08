import Whatsapp from "../models/Whatsapp";
import logger from "../utils/logger";

/**
 * Inversão de dependência do gerenciador de sessão do WhatsApp.
 *
 * `libs/wbot.ts` precisa disparar duas ações que vivem em serviços:
 * reconectar uma sessão e importar histórico. Importá-las diretamente colocava
 * a camada de infraestrutura dependendo da camada de serviço, e era o que
 * fechava o ciclo de 133 arquivos medido pelo grafo (HEALTH-003).
 *
 * Aqui o sentido se inverte: `libs/wbot.ts` passa a depender apenas destas
 * assinaturas, que ele mesmo define. Quem fornece a implementação é o ponto de
 * composição (`server.ts`), que já é onde as sessões são iniciadas.
 *
 * **Falha alto, nunca em silêncio.** Um gancho não registrado significaria
 * sessão que nunca reconecta e histórico que nunca importa — sem erro visível,
 * o pior modo de falha possível para este produto. Por isso a ausência é
 * registrada como erro explícito, com o nome do gancho.
 */

type IniciarSessao = (whatsapp: Whatsapp, companyId: number) => void;
type ImportarMensagens = (whatsappId: number) => void;

interface Ganchos {
  iniciarSessao?: IniciarSessao;
  importarMensagens?: ImportarMensagens;
}

const ganchos: Ganchos = {};

export const registrarGanchosDeSessao = (novos: Ganchos): void => {
  if (novos.iniciarSessao) ganchos.iniciarSessao = novos.iniciarSessao;
  if (novos.importarMensagens) ganchos.importarMensagens = novos.importarMensagens;
};

/** Só para teste: devolve o registro ao estado inicial. */
export const limparGanchosDeSessao = (): void => {
  delete ganchos.iniciarSessao;
  delete ganchos.importarMensagens;
};

export const ganchosRegistrados = (): string[] =>
  Object.keys(ganchos).filter(k => typeof (ganchos as any)[k] === "function");

const ausente = (nome: string): void => {
  logger.error(
    {
      event: "session_hook_not_registered",
      hook: nome
    },
    `Gancho de sessão "${nome}" não foi registrado. A ação foi ignorada. ` +
      "Registre em server.ts com registrarGanchosDeSessao antes de iniciar sessões."
  );
};

export const iniciarSessaoWhatsapp = (
  whatsapp: Whatsapp,
  companyId: number
): void => {
  if (!ganchos.iniciarSessao) return ausente("iniciarSessao");
  ganchos.iniciarSessao(whatsapp, companyId);
};

export const importarMensagensWhatsapp = (whatsappId: number): void => {
  if (!ganchos.importarMensagens) return ausente("importarMensagens");
  ganchos.importarMensagens(whatsappId);
};
