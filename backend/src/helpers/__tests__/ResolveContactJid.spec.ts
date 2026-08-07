import type { WAMessageKey } from "@whiskeysockets/baileys";
import { resolvePhoneJid, isUnresolvedLid } from "../ResolveContactJid";

const PN = "558896090796@s.whatsapp.net";
const LID = "210986577449008@lid";

describe("resolvePhoneJid", () => {
  it("mantem um JID de telefone inalterado", () => {
    const key = { remoteJid: PN, fromMe: false, id: "A" } as WAMessageKey;
    expect(resolvePhoneJid(PN, key)).toBe(PN);
  });

  it("troca o LID pelo telefone real em conversa 1:1", () => {
    // Chave observada em producao: remoteJid LID + senderPn com o telefone.
    const key = {
      remoteJid: LID,
      senderPn: PN,
      fromMe: false,
      id: "A"
    } as WAMessageKey;

    expect(resolvePhoneJid(LID, key)).toBe(PN);
  });

  it("troca o LID do participante pelo telefone em grupo", () => {
    const key = {
      remoteJid: "1203630@g.us",
      participant: LID,
      participantPn: PN,
      fromMe: false,
      id: "A"
    } as WAMessageKey;

    expect(resolvePhoneJid(LID, key)).toBe(PN);
  });

  it("usa participantPn quando o LID vem em participantLid", () => {
    const key = {
      remoteJid: "1203630@g.us",
      participantLid: LID,
      participantPn: PN,
      fromMe: false,
      id: "A"
    } as WAMessageKey;

    expect(resolvePhoneJid(LID, key)).toBe(PN);
  });

  it("nao inventa telefone quando o mapeamento nao veio", () => {
    const key = { remoteJid: LID, fromMe: false, id: "A" } as WAMessageKey;
    expect(resolvePhoneJid(LID, key)).toBe(LID);
  });

  it("nao usa o telefone do remetente para um participante ambiguo", () => {
    // senderPn descreve o remetente, nao um terceiro LID desconhecido.
    const key = {
      remoteJid: "1203630@g.us",
      participant: "111111111111111@lid",
      participantLid: "111111111111111@lid",
      participantPn: "5511999999999@s.whatsapp.net",
      senderPn: PN,
      fromMe: false,
      id: "A"
    } as WAMessageKey;

    expect(resolvePhoneJid("222222222222222@lid", key)).toBe(
      "222222222222222@lid"
    );
  });

  it("remove o sufixo de device ao normalizar", () => {
    const key = {
      remoteJid: "558896090796:12@s.whatsapp.net",
      fromMe: false,
      id: "A"
    } as WAMessageKey;

    expect(resolvePhoneJid("558896090796:12@s.whatsapp.net", key)).toBe(PN);
  });

  it("retorna undefined para entrada vazia", () => {
    expect(resolvePhoneJid(undefined, null)).toBeUndefined();
    expect(resolvePhoneJid("", null)).toBeUndefined();
  });
});

describe("isUnresolvedLid", () => {
  it("identifica identidade que continua sem telefone", () => {
    expect(isUnresolvedLid(LID)).toBe(true);
    expect(isUnresolvedLid(PN)).toBe(false);
    expect(isUnresolvedLid(undefined)).toBe(false);
  });
});
