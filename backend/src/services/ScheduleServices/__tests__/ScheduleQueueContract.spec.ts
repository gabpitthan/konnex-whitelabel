import fs from "fs";
import path from "path";

describe("schedule queue contract", () => {
  it("queues only tenant-scoped claim metadata, never the Schedule payload", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../../queues.ts"),
      "utf8"
    );
    const scanner = source.slice(
      source.indexOf("async function handleVerifySchedules"),
      source.indexOf("async function handleSendScheduledMessage")
    );

    expect(scanner).toContain("scheduleId: claim.id");
    expect(scanner).toContain("companyId: claim.companyId");
    expect(scanner).toContain("dispatchKey: claim.dispatchKey");
    expect(scanner).not.toContain("{ schedule }");
    expect(scanner).not.toContain("schedule.contact");
  });
});
