import Whatsapp from "../../../models/Whatsapp";
import RotateApiTokenService from "../RotateApiTokenService";

jest.mock("../../../models/Whatsapp", () => ({
  findOne: jest.fn()
}));

const findOne = Whatsapp.findOne as jest.Mock;

describe("RotateApiTokenService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rotates only a WhatsApp connection owned by the tenant", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    findOne.mockResolvedValue({ update });

    const token = await RotateApiTokenService(7, 11);

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 7, companyId: 11, channel: "whatsapp" }
    });
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(update).toHaveBeenCalledWith({ token });
  });

  it("fails closed for a foreign or missing connection", async () => {
    findOne.mockResolvedValue(null);
    await expect(RotateApiTokenService(7, 11)).rejects.toMatchObject({
      statusCode: 404,
      message: "ERR_NO_WAPP_FOUND"
    });
  });
});
