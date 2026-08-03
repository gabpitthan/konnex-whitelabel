const handleMsgAck = jest.fn();

jest.mock("../../services/WbotServices/wbotMessageListener", () => ({
  handleMsgAck
}));

import handleMessageAckQueue from "../handleMessageAckQueue";

describe("handleMessageAckQueue", () => {
  it("propagates companyId to the tenant-scoped message lookup", async () => {
    const msg = { key: { id: "wamid-1" } };

    await handleMessageAckQueue.handle({
      data: { msg, chat: 3, companyId: 7 }
    });

    expect(handleMsgAck).toHaveBeenCalledWith(msg, 3, 7);
  });

  it("rejects invalid jobs so Bull can retry and retain the failure", async () => {
    await expect(
      handleMessageAckQueue.handle({ data: { msg: {}, chat: 3 } })
    ).rejects.toThrow("INVALID_MESSAGE_ACK_JOB_DATA");
  });

  it("does not swallow handler failures", async () => {
    handleMsgAck.mockRejectedValueOnce(new Error("provider failed"));
    await expect(
      handleMessageAckQueue.handle({
        data: { msg: {}, chat: 3, companyId: 7 }
      })
    ).rejects.toThrow("provider failed");
  });
});
