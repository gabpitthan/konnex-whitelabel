const getWbot = jest.fn();
const handleMessage = jest.fn();

jest.mock("../../libs/wbot", () => ({ getWbot }));
jest.mock("../../services/WbotServices/wbotMessageListener", () => ({
  handleMessage
}));

import handleMessageQueue from "../handleMessageQueue";

describe("handleMessageQueue", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes the tenant context to the message handler", async () => {
    const socket = { id: "socket" };
    const message = { key: { id: "wamid-1" } };
    getWbot.mockReturnValue(socket);

    await handleMessageQueue.handle({
      data: { message, wbot: 4, companyId: 7 }
    });

    expect(getWbot).toHaveBeenCalledWith(4);
    expect(handleMessage).toHaveBeenCalledWith(message, socket, 7);
  });

  it("rejects invalid data so Bull can retain the failure", async () => {
    await expect(
      handleMessageQueue.handle({ data: { message: {}, wbot: 4 } })
    ).rejects.toThrow("INVALID_MESSAGE_JOB_DATA");
  });

  it("rejects when the WhatsApp session is unavailable", async () => {
    getWbot.mockReturnValue(undefined);
    await expect(
      handleMessageQueue.handle({
        data: { message: {}, wbot: 4, companyId: 7 }
      })
    ).rejects.toThrow("WHATSAPP_SESSION_NOT_FOUND");
  });

  it("does not swallow handler failures", async () => {
    getWbot.mockReturnValue({ id: "socket" });
    handleMessage.mockRejectedValueOnce(new Error("provider failed"));
    await expect(
      handleMessageQueue.handle({
        data: { message: {}, wbot: 4, companyId: 7 }
      })
    ).rejects.toThrow("provider failed");
  });
});
