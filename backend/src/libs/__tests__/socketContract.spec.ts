// A partir de 1.35 o código não tem valor embutido para segredo: o fallback
// `JWT_SECRET || "mysecret"` era público e transformava um `.env` incompleto em
// bypass de autenticação (ver `config/requiredSecrets.ts`). Um teste que assina
// token passa a fornecer o seu próprio segredo, antes de importar a config.
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "jest-only-secret-nunca-usar-fora-do-teste-0123456789";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "jest-only-refresh-nunca-usar-fora-do-teste-0123456789";

// eslint-disable-next-line import/first
import { sign } from "jsonwebtoken";
// eslint-disable-next-line import/first
import authConfig from "../../config/auth";
import {
  namespaceCompanyId,
  normalizeNamespace,
  notificationRoom,
  statusRoom,
  ticketPayloadSchema,
  ticketRoom,
  verifySocketIdentity,
  workspaceNamespace
} from "../socketContract";

const tokenFor = (id: number, companyId: number): string =>
  sign({ id, companyId, profile: "admin" }, authConfig.secret, {
    expiresIn: "15m"
  });

describe("Socket.IO multi-tenant contract", () => {
  it("maps legacy numeric namespaces to the canonical workspace", () => {
    expect(normalizeNamespace("7")).toBe("/workspace-7");
    expect(normalizeNamespace("/7")).toBe("/workspace-7");
    expect(normalizeNamespace("/workspace-7")).toBe("/workspace-7");
  });

  it("builds tenant-scoped namespace and room names", () => {
    expect(workspaceNamespace(7)).toBe("/workspace-7");
    expect(namespaceCompanyId("/workspace-7")).toBe(7);
    expect(ticketRoom(7, 42)).toBe("ticket:7:42");
    expect(statusRoom(7, "open")).toBe("tickets:7:open");
    expect(notificationRoom(7)).toBe("notifications:7");
  });

  it("accepts a token only in its own company namespace", () => {
    const identity = verifySocketIdentity(tokenFor(3, 7), "/workspace-7");
    expect(identity).toMatchObject({ id: 3, companyId: 7, profile: "admin" });
  });

  it("rejects a valid tenant A token in tenant B namespace", () => {
    expect(() =>
      verifySocketIdentity(tokenFor(3, 7), "/workspace-8")
    ).toThrow("TENANT_NAMESPACE_MISMATCH");
  });

  it("rejects malformed and non-numeric identities", () => {
    const malformed = sign(
      { userId: "legacy-uuid", companyId: 7, profile: "admin" },
      authConfig.secret
    );
    expect(() =>
      verifySocketIdentity(malformed, "/workspace-7")
    ).toThrow();
  });

  it("accepts only positive numeric ticket identifiers", () => {
    expect(ticketPayloadSchema.parse({ ticketId: 12 })).toEqual({ ticketId: 12 });
    expect(ticketPayloadSchema.safeParse({ ticketId: -1 }).success).toBe(false);
    expect(ticketPayloadSchema.safeParse({ ticketId: "uuid" }).success).toBe(false);
  });
});
