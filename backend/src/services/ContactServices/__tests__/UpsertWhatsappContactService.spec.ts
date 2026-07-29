const findOrCreate = jest.fn();
const emit = jest.fn();

jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: { findOrCreate }
}));
jest.mock("../../../libs/socket", () => ({
  getIO: () => ({ of: () => ({ emit }) })
}));

import UpsertWhatsappContactService from "../UpsertWhatsappContactService";

const transaction = {
  afterCommit: jest.fn()
} as any;
const contactData = {
  name: "Contact",
  number: "5511999999999",
  isGroup: false,
  companyId: 7,
  remoteJid: "5511999999999@s.whatsapp.net",
  whatsappId: 3
};

describe("UpsertWhatsappContactService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the tenant composite identity and emits only after commit", async () => {
    const contact = {
      id: 11,
      name: "Contact",
      reload: jest.fn().mockResolvedValue(undefined),
      update: jest.fn()
    };
    findOrCreate.mockResolvedValue([contact, true]);

    await expect(
      UpsertWhatsappContactService({ contactData, transaction })
    ).resolves.toBe(contact);

    expect(findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { number: "5511999999999", companyId: 7 },
        transaction
      })
    );
    expect(emit).not.toHaveBeenCalled();
    transaction.afterCommit.mock.calls[0][0]();
    expect(emit).toHaveBeenCalledWith("company-7-contact", {
      action: "create",
      contact
    });
  });

  it("updates an existing contact without changing its tenant", async () => {
    const contact = {
      id: 11,
      name: "5511999999999",
      reload: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined)
    };
    findOrCreate.mockResolvedValue([contact, false]);

    await UpsertWhatsappContactService({ contactData, transaction });

    expect(contact.update).toHaveBeenCalledWith(
      {
        remoteJid: contactData.remoteJid,
        isGroup: false,
        whatsappId: 3,
        name: "Contact"
      },
      { transaction }
    );
  });

  it("rejects invalid ownership before touching the database", async () => {
    await expect(
      UpsertWhatsappContactService({
        contactData: { ...contactData, companyId: 0 },
        transaction
      })
    ).rejects.toThrow("ERR_WHATSAPP_CONTACT_INVALID_OWNER");
    expect(findOrCreate).not.toHaveBeenCalled();
  });
});
