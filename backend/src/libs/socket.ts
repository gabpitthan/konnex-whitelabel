import { Server as HttpServer } from "http";
import { Namespace, Server as SocketIOServer, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

import User from "../models/User";
import AppError from "../errors/AppError";
import logger from "../utils/logger";
import AuthorizeTicketRoomService from "../services/SocketServices/AuthorizeTicketRoomService";
import {
  WORKSPACE_NAMESPACE,
  SocketUser,
  normalizeNamespace,
  notificationRoom,
  statusPayloadSchema,
  statusRoom,
  ticketPayloadSchema,
  ticketRoom,
  verifySocketIdentity,
  workspaceNamespace
} from "./socketContract";

export {
  notificationRoom,
  statusRoom,
  ticketRoom,
  workspaceNamespace
} from "./socketContract";

const CONFIGURED_NAMESPACE = Symbol("configuredWorkspaceNamespace");

const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
  : ["http://localhost:3000"];

type SocketAck = (result: {
  ok: boolean;
  code?: "INVALID_PAYLOAD" | "TICKET_NOT_FOUND" | "FORBIDDEN" | "INTERNAL_ERROR";
}) => void;

class SocketCompatibleAppError extends Error {
  public data: { code: string; statusCode: number };

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "SocketAuthError";
    this.data = { code, statusCode };
    Error.captureStackTrace?.(this, SocketCompatibleAppError);
  }
}

let io: SocketIOServer;

const safeAck = (ack: unknown, result: Parameters<SocketAck>[0]): void => {
  if (typeof ack === "function") {
    (ack as SocketAck)(result);
  }
};

const authenticateSocket = async (
  socket: Socket,
  next: (error?: Error) => void
): Promise<void> => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || !token) {
    return next(new SocketCompatibleAppError("Token ausente", 401, "AUTH_TOKEN_MISSING"));
  }

  try {
    const payload = verifySocketIdentity(token, socket.nsp.name);

    const user = await User.findOne({
      where: { id: payload.id, companyId: payload.companyId },
      attributes: ["id", "companyId", "profile"]
    });

    if (!user) {
      return next(new SocketCompatibleAppError("Usuário inválido", 401, "AUTH_USER_INVALID"));
    }

    socket.data.user = payload;
    socket.data.companyId = payload.companyId;
    return next();
  } catch (error) {
    if (error instanceof Error && error.message === "TENANT_NAMESPACE_MISMATCH") {
      logger.warn({ event: "socket_tenant_mismatch", namespace: socket.nsp.name });
      return next(
        new SocketCompatibleAppError(
          "Namespace não autorizado",
          403,
          "TENANT_NAMESPACE_MISMATCH"
        )
      );
    }
    logger.warn({ event: "socket_auth_failed", namespace: socket.nsp.name });
    return next(new SocketCompatibleAppError("Token inválido", 401, "AUTH_TOKEN_INVALID"));
  }
};

const configureWorkspaceNamespace = (namespace: Namespace): void => {
  const configured = namespace as Namespace & { [CONFIGURED_NAMESPACE]?: boolean };
  if (configured[CONFIGURED_NAMESPACE]) return;
  configured[CONFIGURED_NAMESPACE] = true;

  namespace.use((socket, next) => {
    authenticateSocket(socket, next).catch(() =>
      next(new SocketCompatibleAppError("Falha de autenticação", 500, "AUTH_INTERNAL_ERROR"))
    );
  });

  namespace.on("connection", socket => {
    const user = socket.data.user as SocketUser;
    const companyId = user.companyId;

    logger.info({
      event: "socket_connected",
      socketId: socket.id,
      userId: user.id,
      companyId,
      namespace: socket.nsp.name
    });

    socket.on("joinChatBox", async (payload: unknown, ack?: SocketAck) => {
      const parsed = ticketPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        safeAck(ack, { ok: false, code: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const ticket = await AuthorizeTicketRoomService({
          ticketId: parsed.data.ticketId,
          companyId
        });

        if (!ticket) {
          safeAck(ack, { ok: false, code: "TICKET_NOT_FOUND" });
          return;
        }

        await socket.join(ticketRoom(companyId, ticket.id));
        safeAck(ack, { ok: true });
      } catch (error) {
        logger.error({
          event: "socket_join_ticket_failed",
          userId: user.id,
          companyId,
          ticketId: parsed.data.ticketId
        });
        safeAck(ack, { ok: false, code: "INTERNAL_ERROR" });
      }
    });

    const leaveTicket = async (payload: unknown, ack?: SocketAck): Promise<void> => {
      const parsed = ticketPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        safeAck(ack, { ok: false, code: "INVALID_PAYLOAD" });
        return;
      }
      await socket.leave(ticketRoom(companyId, parsed.data.ticketId));
      safeAck(ack, { ok: true });
    };

    socket.on("leaveChatBox", leaveTicket);
    // Compatibility alias for already-open 1.7 browser tabs.
    socket.on("joinChatBoxLeave", leaveTicket);

    const joinStatus = async (payload: unknown, ack?: SocketAck): Promise<void> => {
      const parsed = statusPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        safeAck(ack, { ok: false, code: "INVALID_PAYLOAD" });
        return;
      }
      await socket.join(statusRoom(companyId, parsed.data.status));
      safeAck(ack, { ok: true });
    };

    const leaveStatus = async (payload: unknown, ack?: SocketAck): Promise<void> => {
      const parsed = statusPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        safeAck(ack, { ok: false, code: "INVALID_PAYLOAD" });
        return;
      }
      await socket.leave(statusRoom(companyId, parsed.data.status));
      safeAck(ack, { ok: true });
    };

    socket.on("joinTickets", joinStatus);
    socket.on("leaveTickets", leaveStatus);
    socket.on("joinTicketsLeave", leaveStatus);

    socket.on("joinNotification", async (_payload?: unknown, ack?: SocketAck) => {
      await socket.join(notificationRoom(companyId));
      safeAck(ack, { ok: true });
    });

    socket.on("leaveNotification", async (_payload?: unknown, ack?: SocketAck) => {
      await socket.leave(notificationRoom(companyId));
      safeAck(ack, { ok: true });
    });

    socket.on("disconnect", reason => {
      logger.info({
        event: "socket_disconnected",
        socketId: socket.id,
        userId: user.id,
        companyId,
        reason
      });
    });
  });
};

export const initIO = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new SocketCompatibleAppError("Origem não autorizada", 403, "CORS_DENIED"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    maxHttpBufferSize: 1e6,
    pingTimeout: 20000,
    pingInterval: 25000
  });

  // Preserve existing emitters while moving every numeric company namespace
  // into the authenticated canonical workspace namespace.
  const originalOf = io.of.bind(io);
  (io as SocketIOServer & { of: SocketIOServer["of"] }).of = ((
    name: Parameters<SocketIOServer["of"]>[0],
    ...args: any[]
  ) => originalOf(normalizeNamespace(name) as any, ...args)) as SocketIOServer["of"];

  io.on("new_namespace", namespace => {
    if (WORKSPACE_NAMESPACE.test(namespace.name)) {
      configureWorkspaceNamespace(namespace);
    }
  });

  // Allows clients to create their canonical workspace namespace on demand.
  io.of(WORKSPACE_NAMESPACE);

  const isAdminEnabled =
    process.env.SOCKET_ADMIN === "true" && process.env.NODE_ENV !== "production";
  if (isAdminEnabled && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    instrument(io, {
      auth: {
        type: "basic",
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
      },
      mode: "development",
      readonly: true
    });
  }

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new AppError("Socket IO não inicializado", 500);
  }
  return io;
};

export const closeIO = async (): Promise<void> => {
  if (!io) return;
  const activeIO = io;
  io = undefined;
  await new Promise<void>(resolve => activeIO.close(() => resolve()));
};
