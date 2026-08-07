const findOne = jest.fn();

jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: { findOne }
}));

import { Op } from "sequelize";

import FindWhatsappContactByJidService from "../FindWhatsappContactByJidService";

const contact = { id: 42, number: "558896090796" };

describe("FindWhatsappContactByJidService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("procura pelo JID antes do numero e nao consulta duas vezes ao achar", async () => {
    findOne.mockResolvedValueOnce(contact);

    await expect(
      FindWhatsappContactByJidService("558896090796@s.whatsapp.net", 1)
    ).resolves.toBe(contact);

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      where: {
        companyId: 1,
        remoteJid: { [Op.in]: ["558896090796@s.whatsapp.net"] }
      }
    });
  });

  it("cai para o numero quando o JID nao esta gravado", async () => {
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(contact);

    await expect(
      FindWhatsappContactByJidService("558896090796@s.whatsapp.net", 1)
    ).resolves.toBe(contact);

    expect(findOne).toHaveBeenNthCalledWith(2, {
      where: { companyId: 1, number: "558896090796" }
    });
  });

  it("normaliza device e c.us antes de procurar", async () => {
    findOne.mockResolvedValue(null);

    await FindWhatsappContactByJidService("558896090796:12@c.us", 1);

    expect(findOne).toHaveBeenNthCalledWith(1, {
      where: {
        companyId: 1,
        remoteJid: {
          [Op.in]: ["558896090796@s.whatsapp.net", "558896090796:12@c.us"]
        }
      }
    });
  });

  // O ponto do lote: um LID nunca pode virar busca por `number`. Os digitos de
  // `100236483629289@lid` sao uma sequencia como qualquer outra e casariam com
  // um telefone homonimo de outro contato.
  it("nao procura um LID pelo campo numero", async () => {
    findOne.mockResolvedValueOnce(null);

    await expect(
      FindWhatsappContactByJidService("100236483629289@lid", 1)
    ).resolves.toBeNull();

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      where: {
        companyId: 1,
        remoteJid: { [Op.in]: ["100236483629289@lid"] }
      }
    });
  });

  it("encontra um contato ja gravado com LID pelo proprio JID", async () => {
    const lidContact = { id: 3, number: "100236483629289" };
    findOne.mockResolvedValueOnce(lidContact);

    await expect(
      FindWhatsappContactByJidService("100236483629289@lid", 1)
    ).resolves.toBe(lidContact);
  });

  it("usa o id do grupo como numero", async () => {
    findOne.mockResolvedValue(null);

    await FindWhatsappContactByJidService("120363@g.us", 1);

    expect(findOne).toHaveBeenNthCalledWith(2, {
      where: { companyId: 1, number: "120363" }
    });
  });

  it("nunca consulta sem tenant valido", async () => {
    await expect(
      FindWhatsappContactByJidService("558896090796@s.whatsapp.net", 0)
    ).resolves.toBeNull();
    await expect(
      FindWhatsappContactByJidService("558896090796@s.whatsapp.net", -1)
    ).resolves.toBeNull();
    await expect(FindWhatsappContactByJidService(null, 1)).resolves.toBeNull();
    await expect(
      FindWhatsappContactByJidService("sem-arroba", 1)
    ).resolves.toBeNull();

    expect(findOne).not.toHaveBeenCalled();
  });
});
