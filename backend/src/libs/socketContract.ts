import { verify } from "jsonwebtoken";
import { z } from "zod";
import authConfig from "../config/auth";

export const WORKSPACE_NAMESPACE = /^\/workspace-(\d+)$/;
export const LEGACY_COMPANY_NAMESPACE = /^\/?(\d+)$/;

export const jwtPayloadSchema = z.object({
  id: z.coerce.number().int().positive(),
  companyId: z.coerce.number().int().positive(),
  profile: z.string().min(1),
  iat: z.number().optional(),
  exp: z.number().optional()
});

export const ticketPayloadSchema = z.union([
  z.object({ ticketId: z.coerce.number().int().positive() }),
  z.coerce.number().int().positive().transform(ticketId => ({ ticketId }))
]);

export const statusPayloadSchema = z.union([
  z.object({ status: z.enum(["open", "closed", "pending"]) }),
  z.enum(["open", "closed", "pending"]).transform(status => ({ status }))
]);

export type SocketUser = z.infer<typeof jwtPayloadSchema>;

export const workspaceNamespace = (companyId: number | string): string => {
  const parsed = z.coerce.number().int().positive().parse(companyId);
  return `/workspace-${parsed}`;
};

export const namespaceCompanyId = (name: string): number | null => {
  const match = name.match(WORKSPACE_NAMESPACE);
  return match ? Number(match[1]) : null;
};

export const normalizeNamespace = (name: unknown): unknown => {
  if (typeof name !== "string") return name;
  const legacy = name.match(LEGACY_COMPANY_NAMESPACE);
  return legacy ? workspaceNamespace(legacy[1]) : name;
};

export const verifySocketIdentity = (
  token: string,
  namespace: string
): SocketUser => {
  const payload = jwtPayloadSchema.parse(verify(token, authConfig.secret));
  const targetCompanyId = namespaceCompanyId(namespace);
  if (!targetCompanyId || targetCompanyId !== payload.companyId) {
    throw new Error("TENANT_NAMESPACE_MISMATCH");
  }
  return payload;
};

export const ticketRoom = (companyId: number, ticketId: number): string =>
  `ticket:${companyId}:${ticketId}`;

export const statusRoom = (companyId: number, status: string): string =>
  `tickets:${companyId}:${status}`;

export const notificationRoom = (companyId: number): string =>
  `notifications:${companyId}`;
