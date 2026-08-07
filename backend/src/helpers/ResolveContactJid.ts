import type { WAMessageKey } from "@whiskeysockets/baileys";

/**
 * O WhatsApp entrega o remetente como LID (`<id>@lid`) quando a conta usa o
 * identificador de privacidade. O LID nao e um telefone: gravado no campo
 * `number` do contato ele nunca deduplica com a base importada, e quebra
 * campanha, relatorio e integracao externa.
 *
 * O Baileys 6.7.22 ja entrega o telefone real junto da chave, em
 * `senderPn`/`participantPn` (ver `lib/Types/Message.d.ts`, preenchidos a
 * partir de `stanza.attrs.sender_pn`/`participant_pn` em
 * `lib/Utils/decode-wa-message.js`). Estes helpers preferem esse telefone e
 * so caem para o LID quando o mapeamento nao veio, porque perder a identidade
 * e pior do que registrar um LID.
 *
 * `isLidJid` e `normalizeJid` espelham `lib/WABinary/jid-utils.js` do Baileys.
 * Sao reimplementados aqui de proposito: o pacote e ESM e importa-lo em tempo
 * de execucao tornaria este helper impossivel de testar sem mock, e um mock
 * so provaria o comportamento do proprio mock.
 */

/** Espelha `isLidUser` de `lib/WABinary/jid-utils.js`. */
export const isLidJid = (jid?: string | null): boolean =>
  typeof jid === "string" && jid.endsWith("@lid");

/** Espelha `jidNormalizedUser`: descarta o device e mapeia `c.us`. */
export const normalizeJid = (jid?: string | null): string | undefined => {
  if (typeof jid !== "string") return undefined;

  const separator = jid.indexOf("@");
  if (separator < 0) return undefined;

  const rawServer = jid.slice(separator + 1);
  const userCombined = jid.slice(0, separator);
  const user = userCombined.split(":")[0].split("_")[0];
  if (!user) return undefined;

  const server = rawServer === "c.us" ? "s.whatsapp.net" : rawServer;
  return `${user}@${server}`;
};

/**
 * Resolve um JID candidato para o telefone real quando ele vier como LID.
 *
 * O par LID/telefone e procurado nos campos que o Baileys popula na chave da
 * mensagem, comparando qual deles corresponde ao candidato recebido.
 */
export const resolvePhoneJid = (
  candidate: string | null | undefined,
  key: WAMessageKey | null | undefined
): string | undefined => {
  if (!candidate) return undefined;
  if (!isLidJid(candidate)) return normalizeJid(candidate);

  if (key) {
    const {
      remoteJid,
      participant,
      senderLid,
      senderPn,
      participantLid,
      participantPn
    } = key;

    if (participantPn && (candidate === participant || candidate === participantLid)) {
      return normalizeJid(participantPn);
    }

    if (senderPn && (candidate === remoteJid || candidate === senderLid)) {
      return normalizeJid(senderPn);
    }

    // A mensagem trouxe um unico mapeamento; usa-o quando nao ha ambiguidade.
    if (senderPn && !participantPn && !participantLid) {
      return normalizeJid(senderPn);
    }
  }

  return normalizeJid(candidate);
};

/** `true` quando a identidade resolvida ainda e um LID, ou seja, sem telefone. */
export const isUnresolvedLid = (jid: string | null | undefined): boolean =>
  isLidJid(jid);

export default resolvePhoneJid;
