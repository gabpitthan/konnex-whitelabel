import fs from "fs";
import path from "path";

const read = (relative: string): string => fs.readFileSync(
  path.resolve(__dirname, relative),
  "utf8"
);

describe("campaign tenant contract", () => {
  it("uses the authenticated company for every campaign mutation endpoint", () => {
    const controller = read("../../../controllers/CampaignController.ts");
    expect(controller).toContain("ShowService(id, companyId)");
    expect(controller).toContain("DeleteService(id, companyId)");
    expect(controller).toContain("CancelService(+id, companyId)");
    expect(controller).toContain("RestartService(+id, companyId)");
    expect(controller).toContain("FindService({ companyId })");
    expect(controller).toContain("Campaign.findOne({ where: { id, companyId } })");
  });

  it("does not look up mutable campaign resources by primary key alone", () => {
    for (const service of ["ShowService.ts", "UpdateService.ts", "DeleteService.ts"]) {
      const source = read(`../${service}`);
      expect(source).toContain("companyId");
      expect(source).not.toContain("findByPk");
    }
  });

  it("validates every foreign campaign relation against the same tenant", () => {
    const source = read("../ValidateCampaignRelationsService.ts");
    for (const model of ["ContactList", "Whatsapp", "User", "Queue"]) {
      expect(source).toContain(`model: ${model}`);
    }
    expect(source).toContain("where: { id: check.id, companyId }");
    expect(read("../CreateService.ts")).toContain("ValidateCampaignRelationsService(data)");
    expect(read("../UpdateService.ts")).toContain("ValidateCampaignRelationsService(data)");
  });

  it("cancels persistent state before best-effort Redis cleanup", () => {
    const source = read("../CancelService.ts");
    expect(source.indexOf('"dispatchStatus" = \'CANCELLED\'')).toBeLessThan(
      source.indexOf("campaignQueue.getJob")
    );
    expect(source).toContain('"companyId" = :companyId');
    expect(source).toContain("campaignQueue.getJob(record.jobId)");
  });
});
