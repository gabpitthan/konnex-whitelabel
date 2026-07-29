const count = jest.fn();

jest.mock("../../../models/Message", () => ({
  __esModule: true,
  default: { count }
}));

import ListMessagesServiceAll from "../ListMessagesServiceAll";

describe("ListMessagesServiceAll", () => {
  beforeEach(() => count.mockReset());

  it("uses the shared model pool and always scopes by company", async () => {
    count.mockResolvedValue(12);

    await expect(
      ListMessagesServiceAll({
        companyId: 7,
        fromMe: true,
        dateStart: "",
        dateEnd: ""
      })
    ).resolves.toEqual({ count: 12 });

    expect(count).toHaveBeenCalledWith({
      where: { companyId: 7, fromMe: true }
    });
  });

  it("rejects partial or inverted date ranges", async () => {
    await expect(
      ListMessagesServiceAll({
        companyId: 7,
        fromMe: false,
        dateStart: "2026-07-31",
        dateEnd: "2026-07-01"
      })
    ).rejects.toMatchObject({
      message: "INVALID_MESSAGE_RANGE",
      statusCode: 400
    });
    expect(count).not.toHaveBeenCalled();
  });
});
