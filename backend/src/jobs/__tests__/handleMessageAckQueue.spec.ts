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
});
