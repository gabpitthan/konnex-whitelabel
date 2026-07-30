import Whatsapp from "../../../models/Whatsapp";
import ListAllWhatsAppService from "../ListAllWhatsAppService";

jest.mock("../../../models/Whatsapp", () => ({
  findAll: jest.fn()
}));
jest.mock("../../../models/Queue", () => ({}));

const findAll = Whatsapp.findAll as jest.Mock;

describe("ListAllWhatsAppService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("scopes the list to the tenant and never selects API tokens", async () => {
    findAll.mockResolvedValue([]);
    await ListAllWhatsAppService({ companyId: 11, session: 0 });

    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 11 },
        attributes: { exclude: ["session", "token"] }
      })
    );
  });
});
