import fs from "fs";
import path from "path";

describe("campaign queue contract", () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, "../../../queues.ts"),
    "utf8"
  );

  it("queues stable tenant-scoped dispatch metadata", () => {
    expect(source).toContain("campaignShippingId: record.id");
    expect(source).toContain("companyId,");
    expect(source).toContain("dispatchKey: record.dispatchKey");
    expect(source).toContain("jobId: `campaign:${record.dispatchKey}`");
  });

  it("claims before loading campaign data and propagates dispatch failure", () => {
    const handler = source.slice(
      source.indexOf("async function handleDispatchCampaign"),
      source.indexOf("async function handleLoginStatus")
    );
    expect(handler.indexOf("BeginCampaignDispatchService")).toBeLessThan(
      handler.indexOf("getCampaignForDispatch(campaignId, companyId)")
    );
    expect(handler).toContain('outcome: "ERROR"');
    expect(handler).toContain("throw err");
    expect(handler).not.toContain("findByPk");
    expect(handler).not.toContain("console.log");
    expect(handler).not.toContain("getCampaign(campaignId, companyId)");
  });

  it("does not reload the full contact list for every prepared recipient", () => {
    const handler = source.slice(
      source.indexOf("async function handlePrepareContact"),
      source.indexOf("async function handleDispatchCampaign")
    );
    expect(handler).toContain("getCampaignForContact(campaignId, companyId)");
    expect(handler).not.toContain("getCampaign(campaignId, companyId)");
  });
});
