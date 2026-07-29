jest.mock("../../database", () => ({
  __esModule: true,
  default: { query: jest.fn() }
}));

jest.mock("../../models/Whatsapp", () => ({
  __esModule: true,
  default: {
    update: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn()
  }
}));

import sequelize from "../../database";
import Whatsapp from "../../models/Whatsapp";
import {
  WhatsappFenceLostError,
  assertWhatsappSessionFence,
  claimWhatsappSessionFence,
  nextWhatsappSessionFence,
  updateWhatsappLifecycleWithFence
} from "../whatsappFence";

const owner = { companyId: 2, whatsappId: 7 };
const mockedWhatsapp = Whatsapp as jest.Mocked<typeof Whatsapp>;
const mockedQuery = sequelize.query as jest.Mock;

describe("PostgreSQL WhatsApp fencing", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allocates the fence as text without JavaScript precision loss", async () => {
    mockedQuery.mockResolvedValue([{ fence: "9007199254740993" }]);
    await expect(nextWhatsappSessionFence()).resolves.toBe(
      "9007199254740993"
    );
  });

  it("claims only the tenant row and rejects a stale claim", async () => {
    mockedWhatsapp.update.mockResolvedValueOnce([1] as any);
    await expect(claimWhatsappSessionFence(owner, "9")).resolves.toBeUndefined();
    expect(mockedWhatsapp.update).toHaveBeenCalledWith(
      { sessionFence: "9" },
      expect.objectContaining({
        where: expect.objectContaining({
          id: 7,
          companyId: 2,
          channel: "whatsapp"
        })
      })
    );

    mockedWhatsapp.update.mockResolvedValueOnce([0] as any);
    await expect(claimWhatsappSessionFence(owner, "8")).rejects.toBeInstanceOf(
      WhatsappFenceLostError
    );
  });

  it("uses company and current fence for lifecycle CAS", async () => {
    const current = { id: 7, companyId: 2, sessionFence: "9" } as Whatsapp;
    mockedWhatsapp.update.mockResolvedValueOnce([1] as any);
    mockedWhatsapp.findOne.mockResolvedValueOnce(current);

    await expect(
      updateWhatsappLifecycleWithFence(owner, "9", { status: "CONNECTED" })
    ).resolves.toBe(current);
    expect(mockedWhatsapp.update).toHaveBeenCalledWith(
      { status: "CONNECTED" },
      {
        where: {
          id: 7,
          companyId: 2,
          sessionFence: "9"
        }
      }
    );

    mockedWhatsapp.update.mockResolvedValueOnce([0] as any);
    await expect(
      updateWhatsappLifecycleWithFence(owner, "8", { status: "DISCONNECTED" })
    ).rejects.toBeInstanceOf(WhatsappFenceLostError);
  });

  it("denies a mismatched tenant or fence", async () => {
    mockedWhatsapp.count.mockResolvedValueOnce(0);
    await expect(
      assertWhatsappSessionFence({ companyId: 3, whatsappId: 7 }, "9")
    ).rejects.toBeInstanceOf(WhatsappFenceLostError);
  });
});
