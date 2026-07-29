const ticketFindOne = jest.fn();
const showTicket = jest.fn();
const createLog = jest.fn();

jest.mock("../../../models/Ticket", () => ({
  __esModule: true,
  default: {
    findOne: ticketFindOne,
    create: jest.fn()
  }
}));
jest.mock("../ShowTicketService", () => ({
  __esModule: true,
  default: showTicket
}));
jest.mock("../CreateLogTicketService", () => ({
  __esModule: true,
  default: createLog
}));

import FindOrCreateTicketService from "../FindOrCreateTicketService";

describe("FindOrCreateTicketService transactional unread counter", () => {
  beforeEach(() => jest.clearAllMocks());

  it("increments unread atomically while holding the active ticket lock", async () => {
    const transaction = { LOCK: { UPDATE: "UPDATE" } } as any;
    const increment = jest.fn().mockResolvedValue(undefined);
    const update = jest.fn().mockResolvedValue(undefined);
    const activeTicket = {
      id: 21,
      userId: null,
      queueId: null,
      isGroup: false,
      increment,
      update
    };
    const loadedTicket = { id: 21, unreadMessages: 5 };
    ticketFindOne.mockResolvedValue(activeTicket);
    showTicket.mockResolvedValue(loadedTicket);

    await expect(
      FindOrCreateTicketService(
        { id: 11 } as any,
        { id: 3 } as any,
        1,
        7,
        null,
        null,
        undefined,
        "whatsapp",
        false,
        false,
        { enableLGPD: "disabled", DirectTicketsToWallets: false },
        undefined,
        false,
        { transaction, incrementUnread: true }
      )
    ).resolves.toBe(loadedTicket);

    expect(ticketFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction,
        lock: "UPDATE"
      })
    );
    expect(increment).toHaveBeenCalledWith("unreadMessages", {
      by: 1,
      transaction
    });
    expect(update).toHaveBeenCalledWith(
      { isBot: false },
      { transaction }
    );
    expect(createLog).not.toHaveBeenCalled();
  });
});
