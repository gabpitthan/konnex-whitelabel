const withFence = jest.fn(async (_owner, _fence, operation) =>
  operation({ LOCK: { UPDATE: "UPDATE" } })
);
const ticketFindOne = jest.fn();
const createMessage = jest.fn();

jest.mock("../../../libs/whatsappFence", () => ({
  withWhatsappSessionFenceTransaction: withFence
}));
jest.mock("../../../models/Ticket", () => ({
  __esModule: true,
  default: { findOne: ticketFindOne }
}));
jest.mock("../CreateMessageService", () => ({
  __esModule: true,
  default: createMessage
}));

import PersistFencedMessageService from "../PersistFencedMessageService";

describe("PersistFencedMessageService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates the tenant ticket and creates the message in the fenced transaction", async () => {
    const transaction = { LOCK: { UPDATE: "UPDATE" } };
    withFence.mockImplementationOnce(async (_owner, _fence, operation) =>
      operation(transaction)
    );
    const update = jest.fn();
    const currentTicket = {
      id: 11,
      update,
      get: () => ({ id: 11, lastMessage: "hello" })
    };
    ticketFindOne.mockResolvedValue(currentTicket);
    createMessage.mockResolvedValue({ id: 21 });
    const ticket = { id: 11 } as any;

    await expect(
      PersistFencedMessageService({
        owner: { companyId: 7, whatsappId: 3 },
        fence: "12",
        ticket,
        messageData: { wid: "wamid-1", ticketId: 11, body: "hello" },
        ticketValues: { lastMessage: "hello" }
      })
    ).resolves.toEqual({ id: 21 });

    expect(ticketFindOne).toHaveBeenCalledWith({
      where: { id: 11, companyId: 7, whatsappId: 3 },
      transaction,
      lock: "UPDATE"
    });
    expect(update).toHaveBeenCalledWith(
      { lastMessage: "hello" },
      { transaction }
    );
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 7, transaction })
    );
  });

  it("rejects a ticket from another owner before any message write", async () => {
    ticketFindOne.mockResolvedValue(null);

    await expect(
      PersistFencedMessageService({
        owner: { companyId: 8, whatsappId: 3 },
        fence: "12",
        ticket: { id: 11 } as any,
        messageData: { wid: "wamid-1", ticketId: 11, body: "hello" },
        ticketValues: { lastMessage: "hello" }
      })
    ).rejects.toThrow("ERR_MESSAGE_TICKET_INVALID_OWNER");
    expect(createMessage).not.toHaveBeenCalled();
  });
});
