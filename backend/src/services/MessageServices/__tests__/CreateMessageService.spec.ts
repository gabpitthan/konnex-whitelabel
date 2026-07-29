const upsert = jest.fn();
const findOne = jest.fn();
const emit = jest.fn();
const transactionToken = { id: "transaction", afterCommit: jest.fn() };
const transaction = jest.fn(async callback => callback(transactionToken));

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { transaction }
}));
jest.mock("../../../models/Message", () => ({
  __esModule: true,
  default: { upsert, findOne }
}));
jest.mock("../../../libs/socket", () => ({
  getIO: () => ({
    of: () => ({ emit })
  })
}));

import CreateMessageService from "../CreateMessageService";

const messageData = {
  wid: "wamid-1",
  ticketId: 11,
  body: "hello"
};

describe("CreateMessageService", () => {
  beforeEach(() => {
    upsert.mockReset();
    findOne.mockReset();
    emit.mockReset();
    transaction.mockClear();
    transactionToken.afterCommit.mockReset();
  });

  it("persists and loads in one transaction, then emits after commit", async () => {
    const update = jest.fn();
    const message = {
      id: 1,
      wid: "wamid-1",
      queueId: null,
      isPrivate: false,
      ticketId: 11,
      ticket: {
        queueId: null,
        contact: { id: 4 }
      },
      update
    };
    findOne.mockResolvedValue(message);

    await expect(
      CreateMessageService({ messageData, companyId: 7 })
    ).resolves.toBe(message);

    expect(upsert).toHaveBeenCalledWith(
      { ...messageData, companyId: 7 },
      { transaction: transactionToken }
    );
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { wid: "wamid-1", companyId: 7 },
        transaction: transactionToken
      })
    );
    expect(emit).toHaveBeenCalledTimes(1);
    expect(upsert.mock.invocationCallOrder[0]).toBeLessThan(
      emit.mock.invocationCallOrder[0]
    );
  });

  it("rolls back and never emits when the row cannot be loaded", async () => {
    findOne.mockResolvedValue(null);

    await expect(
      CreateMessageService({ messageData, companyId: 7 })
    ).rejects.toThrow("ERR_CREATING_MESSAGE");
    expect(emit).not.toHaveBeenCalled();
  });

  it("rejects an invalid tenant before opening a transaction", async () => {
    await expect(
      CreateMessageService({ messageData, companyId: 0 })
    ).rejects.toThrow("ERR_CREATING_MESSAGE_INVALID_OWNER");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("joins an external transaction and emits only from afterCommit", async () => {
    const message = {
      id: 1,
      wid: "wamid-1",
      queueId: null,
      isPrivate: false,
      ticketId: 11,
      ticket: { queueId: null, contact: { id: 4 } },
      update: jest.fn()
    };
    findOne.mockResolvedValue(message);

    await expect(
      CreateMessageService({
        messageData,
        companyId: 7,
        transaction: transactionToken as any
      })
    ).resolves.toBe(message);

    expect(transaction).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(transactionToken.afterCommit).toHaveBeenCalledTimes(1);

    transactionToken.afterCommit.mock.calls[0][0]();
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
