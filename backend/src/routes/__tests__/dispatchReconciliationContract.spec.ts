import fs from "fs";
import path from "path";

describe("dispatch reconciliation HTTP contract", () => {
  it("mounts authenticated endpoints and enforces admin in every controller", () => {
    const routes = fs.readFileSync(
      path.resolve(__dirname, "../dispatchReconciliationRoutes.ts"),
      "utf8"
    );
    const controller = fs.readFileSync(
      path.resolve(__dirname, "../../controllers/DispatchReconciliationController.ts"),
      "utf8"
    );
    expect(routes.match(/,\n  isAuth,/g)).toHaveLength(3);
    expect(routes).toContain('routes.get(\n  "/dispatch-reconciliations"');
    expect(routes).toContain('routes.post(\n  "/dispatch-reconciliations/:entityType/:entityId"');
    expect(controller).toContain('req.user.profile !== "admin"');
    expect(controller.match(/requireAdmin\(req\)/g)).toHaveLength(3);
    expect(controller).toContain("companyId: req.user.companyId");
    expect(controller).toContain("actorUserId: Number(req.user.id)");
  });
});
