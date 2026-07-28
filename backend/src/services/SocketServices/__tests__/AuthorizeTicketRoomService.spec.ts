import Ticket from "../../../models/Ticket";
import AuthorizeTicketRoomService from "../AuthorizeTicketRoomService";

jest.mock("../../../models/Ticket", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}));

const findOne = Ticket.findOne as jest.Mock;

describe("AuthorizeTicketRoomService", () => {
  it("always scopes the lookup by ticket and company", async () => {
    findOne.mockResolvedValue({ id: 10, companyId: 2 });

    await expect(
      AuthorizeTicketRoomService({ ticketId: 10, companyId: 2 })
    ).resolves.toEqual({ id: 10, companyId: 2 });

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 10, companyId: 2 },
      attributes: ["id", "companyId"]
    });
  });

  it("returns the same generic absence for a ticket outside the tenant", async () => {
    findOne.mockResolvedValue(null);

    await expect(
      AuthorizeTicketRoomService({ ticketId: 99, companyId: 2 })
    ).resolves.toBeNull();
  });
});
