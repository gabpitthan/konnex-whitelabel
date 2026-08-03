const query = jest.fn();
const findOne = jest.fn();

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query }
}));
jest.mock("../../../models/CampaignShipping", () => ({
  __esModule: true,
  default: { findOne }
}));

import BeginCampaignDispatchService from "../BeginCampaignDispatchService";
import CompleteCampaignDispatchService from "../CompleteCampaignDispatchService";
import ConfirmCampaignShippingService from "../ConfirmCampaignShippingService";
import ListPendingCampaignDispatchesService from "../ListPendingCampaignDispatchesService";

describe("campaign dispatch state services", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows one exact tenant/key PENDING claim to enter PROCESSING", async () => {
    query.mockResolvedValueOnce([{ id: 9 }]);
    findOne.mockResolvedValueOnce({ id: 9 });

    await expect(BeginCampaignDispatchService({
      id: 9,
      campaignId: 5,
      companyId: 7,
      dispatchKey: "key"
    })).resolves.toEqual({ id: 9 });

    const [sql] = query.mock.calls[0];
    expect(sql).toContain('"companyId" = :companyId');
    expect(sql).toContain('"dispatchKey" = :dispatchKey');
    expect(sql).toContain('"dispatchStatus" = \'PENDING\'');
    expect(sql).toContain('"dispatchStatus" = \'PROCESSING\'');
    expect(sql).toContain("campaign.status = 'EM_ANDAMENTO'");
  });

  it("drops a duplicate before loading contact data", async () => {
    query.mockResolvedValueOnce([]);
    await expect(BeginCampaignDispatchService({
      id: 9,
      campaignId: 5,
      companyId: 7,
      dispatchKey: "stale"
    })).resolves.toBeNull();
    expect(findOne).not.toHaveBeenCalled();
  });

  it("moves confirmation to a fresh stable PENDING phase atomically", async () => {
    query.mockResolvedValueOnce([{
      id: 9, campaignId: 5, companyId: 7, dispatchKey: "next"
    }]);
    await expect(ConfirmCampaignShippingService({
      companyId: 7,
      number: "5511000000000"
    })).resolves.toEqual(expect.objectContaining({ dispatchKey: "next" }));

    const [sql] = query.mock.calls[0];
    expect(sql).toContain("FOR UPDATE OF shipping SKIP LOCKED");
    expect(sql).toContain("gen_random_uuid()");
    expect(sql).toContain("campaign.\"companyId\" = shipping.\"companyId\"");
    expect(sql).toContain("'AWAITING_CONFIRMATION'");
  });

  it("completes only the exact PROCESSING key", async () => {
    query.mockResolvedValueOnce([{ id: 9 }]);
    await expect(CompleteCampaignDispatchService({
      id: 9,
      companyId: 7,
      dispatchKey: "key",
      outcome: "DONE"
    })).resolves.toBe(true);
    const [sql] = query.mock.calls[0];
    expect(sql).toContain('"deliveredAt" = NOW()');
    expect(sql).toContain('"dispatchStatus" = \'PROCESSING\'');
  });

  it("bounds and scopes recovery to active campaigns", async () => {
    query.mockResolvedValueOnce([]);
    await ListPendingCampaignDispatchesService(900);
    const [sql, options] = query.mock.calls[0];
    expect(sql).toContain("campaign.status = 'EM_ANDAMENTO'");
    expect(sql).toContain("campaign.\"companyId\" = shipping.\"companyId\"");
    expect(sql).toContain("ORDER BY shipping.\"updatedAt\" ASC, shipping.id ASC");
    expect(options.replacements.limit).toBe(500);
  });
});
