const withFence = jest.fn(async (_owner, _fence, operation) =>
  operation({ LOCK: { UPDATE: "UPDATE" } })
);
const upsertContact = jest.fn();
const findTicket = jest.fn();
const findOrCreateTicket = jest.fn();

jest.mock("../../../libs/whatsappFence", () => ({
  withWhatsappSessionFenceTransaction: withFence
}));
jest.mock("../../ContactServices/UpsertWhatsappContactService", () => ({
  __esModule: true,
  default: upsertContact
}));
jest.mock("../../../models/Ticket", () => ({
  __esModule: true,
  default: { findOne: findTicket }
}));
jest.mock("../../TicketServices/FindOrCreateTicketService", () => ({
  __esModule: true,
  default: findOrCreateTicket
}));

import FindOrCreateFencedWhatsappContextService from "../FindOrCreateFencedWhatsappContextService";

const contactData = {
  name: "Contact",
  number: "5511999999999",
  isGroup: false,
  companyId: 7,
  remoteJid: "5511999999999@s.whatsapp.net",
  whatsappId: 3
};
const whatsapp = { id: 3, companyId: 7 } as any;

describe("FindOrCreateFencedWhatsappContextService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates contact and ticket in the fenced transaction with atomic unread increment", async () => {
    const transaction = { LOCK: { UPDATE: "UPDATE" } };
    withFence.mockImplementationOnce(async (_owner, _fence, operation) =>
      operation(transaction)
    );
    const contact = { id: 11 };
    const ticket = { id: 21, unreadMessages: 4 };
    upsertContact.mockResolvedValue(contact);
    findTicket.mockResolvedValue(null);
    findOrCreateTicket.mockResolvedValue(ticket);

    await expect(
      FindOrCreateFencedWhatsappContextService({
        owner: { companyId: 7, whatsappId: 3 },
        fence: "14",
        contactData,
        whatsapp,
        fromMe: false,
        channel: "whatsapp",
        isImported: false,
        settings: { enableLGPD: "disabled" }
      })
    ).resolves.toEqual({
      contact,
      groupContact: undefined,
      ticket,
      previousTicket: null
    });

    expect(findOrCreateTicket).toHaveBeenCalledWith(
      contact,
      whatsapp,
      1,
      7,
      null,
      null,
      undefined,
      "whatsapp",
      false,
      false,
      expect.any(Object),
      undefined,
      false,
      {
        transaction,
        incrementUnread: true
      }
    );
  });

  it("rejects mismatched tenant ownership before contact writes", async () => {
    await expect(
      FindOrCreateFencedWhatsappContextService({
        owner: { companyId: 8, whatsappId: 3 },
        fence: "14",
        contactData,
        whatsapp,
        fromMe: false,
        channel: "whatsapp",
        isImported: false,
        settings: {}
      })
    ).rejects.toThrow("ERR_WHATSAPP_CONTEXT_INVALID_OWNER");
    expect(upsertContact).not.toHaveBeenCalled();
  });
});
