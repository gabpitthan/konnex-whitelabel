import fs from "fs";
import path from "path";

describe("legacy Bull Board removal", () => {
  const backendRoot = path.resolve(__dirname, "../../../");

  it("keeps the legacy dashboard and credentials out of the HTTP application", () => {
    const appSource = fs.readFileSync(
      path.join(backendRoot, "src/app.ts"),
      "utf8"
    );

    expect(appSource).not.toContain("bull-board");
    expect(appSource).not.toContain("/admin/queues");
    expect(appSource).not.toContain("BULL_USER");
    expect(appSource).not.toContain("BULL_PASS");
  });

  it("keeps the vulnerable dashboard packages out of the runtime manifest", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(backendRoot, "package.json"), "utf8")
    );

    expect(manifest.dependencies).not.toHaveProperty("bull-board");
    expect(manifest.dependencies).not.toHaveProperty("basic-auth");
  });
});
