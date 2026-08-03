import { QueryTypes, Transaction } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import { getDispatchReconciliationStaleMs } from "./config";
import ResolveScheduleDispatchOutcome from "../ScheduleServices/ResolveScheduleDispatchOutcome";

type EntityType = "SCHEDULE" | "CAMPAIGN_SHIPPING";
type Action = "ACKNOWLEDGE" | "REARM";

interface Request {
  companyId: number;
  actorUserId: number;
  entityType: EntityType;
  entityId: number;
  action: Action;
  expectedDispatchKey: string;
  reason: string;
  now?: Date;
}

interface LockedDispatch {
  entityId: number;
  parentId: number | null;
  previousStatus: string;
  previousStartedAt: Date;
  phase: "MESSAGE" | "CONFIRMATION" | "CONTENT";
  parentStatus: string;
  sendAt?: Date;
  intervalo?: number | null;
  valorIntervalo?: number | null;
  enviarQuantasVezes?: number | null;
  tipoDias?: number | null;
  contadorEnvio?: number | null;
}

const lockSchedule = async (
  request: Request,
  staleBefore: Date,
  transaction: Transaction
): Promise<LockedDispatch | null> => {
  const rows = await sequelize.query<LockedDispatch>(
    `
      SELECT schedule.id AS "entityId",
             NULL::integer AS "parentId",
             schedule.status AS "previousStatus",
             schedule."dispatchStartedAt" AS "previousStartedAt",
             'MESSAGE'::text AS phase,
             schedule.status AS "parentStatus"
             , schedule."sendAt" AS "sendAt"
             , schedule.intervalo
             , schedule."valorIntervalo"
             , schedule."enviarQuantasVezes"
             , schedule."tipoDias"
             , schedule."contadorEnvio"
        FROM "Schedules" schedule
       WHERE schedule.id = :entityId
         AND schedule."companyId" = :companyId
         AND schedule.status = 'PROCESSANDO'
         AND schedule."dispatchKey" = :expectedDispatchKey
         AND schedule."dispatchStartedAt" <= :staleBefore
       FOR UPDATE
    `,
    {
      replacements: { ...request, staleBefore },
      type: QueryTypes.SELECT,
      transaction
    }
  );
  return rows.length === 1 ? rows[0] : null;
};

const lockCampaignShipping = async (
  request: Request,
  staleBefore: Date,
  transaction: Transaction
): Promise<LockedDispatch | null> => {
  const rows = await sequelize.query<LockedDispatch>(
    `
      SELECT shipping.id AS "entityId",
             shipping."campaignId" AS "parentId",
             shipping."dispatchStatus" AS "previousStatus",
             shipping."dispatchStartedAt" AS "previousStartedAt",
             CASE
               WHEN campaign.confirmation = TRUE
                    AND shipping.confirmation IS NULL
                 THEN 'CONFIRMATION'
               ELSE 'CONTENT'
             END AS phase,
             campaign.status AS "parentStatus"
        FROM "CampaignShipping" shipping
        JOIN "Campaigns" campaign
          ON campaign.id = shipping."campaignId"
         AND campaign."companyId" = shipping."companyId"
       WHERE shipping.id = :entityId
         AND shipping."companyId" = :companyId
         AND shipping."dispatchStatus" = 'PROCESSING'
         AND shipping."dispatchKey" = :expectedDispatchKey
         AND shipping."dispatchStartedAt" <= :staleBefore
       FOR UPDATE OF shipping
    `,
    {
      replacements: { ...request, staleBefore },
      type: QueryTypes.SELECT,
      transaction
    }
  );
  return rows.length === 1 ? rows[0] : null;
};

const updateSchedule = async (
  request: Request,
  locked: LockedDispatch,
  transaction: Transaction
): Promise<string> => {
  const outcome = request.action === "ACKNOWLEDGE"
    ? ResolveScheduleDispatchOutcome({
        sendAt: locked.sendAt as Date,
        intervalo: locked.intervalo,
        valorIntervalo: locked.valorIntervalo,
        enviarQuantasVezes: locked.enviarQuantasVezes,
        tipoDias: locked.tipoDias,
        contadorEnvio: locked.contadorEnvio
      }, request.now)
    : { status: "PENDENTE" as const };
  const nextStatus = outcome.status;
  await sequelize.query(
    outcome.status === "ENVIADA"
      ? `UPDATE "Schedules"
            SET status = 'ENVIADA', "sentAt" = COALESCE("sentAt", :now),
                "dispatchKey" = NULL, "dispatchClaimedAt" = NULL,
                "dispatchStartedAt" = NULL, "updatedAt" = :now
          WHERE id = :entityId AND "companyId" = :companyId
            AND status = 'PROCESSANDO'
            AND "dispatchKey" = :expectedDispatchKey`
      : request.action === "ACKNOWLEDGE"
        ? `UPDATE "Schedules"
            SET status = 'PENDENTE', "sendAt" = :nextSendAt,
                "contadorEnvio" = :nextCounter,
                "dispatchKey" = NULL, "dispatchClaimedAt" = NULL,
                "dispatchStartedAt" = NULL, "updatedAt" = :now
          WHERE id = :entityId AND "companyId" = :companyId
            AND status = 'PROCESSANDO'
            AND "dispatchKey" = :expectedDispatchKey`
        : `UPDATE "Schedules"
            SET status = 'PENDENTE', "dispatchKey" = NULL,
                "dispatchClaimedAt" = NULL, "dispatchStartedAt" = NULL,
                "updatedAt" = :now
          WHERE id = :entityId AND "companyId" = :companyId
            AND status = 'PROCESSANDO'
            AND "dispatchKey" = :expectedDispatchKey`,
    {
      replacements: {
        ...request,
        nextSendAt: outcome.status === "PENDENTE" && "sendAt" in outcome
          ? outcome.sendAt : null,
        nextCounter: outcome.status === "PENDENTE" && "contadorEnvio" in outcome
          ? outcome.contadorEnvio : null
      },
      transaction
    }
  );
  return nextStatus;
};

const updateCampaignShipping = async (
  request: Request,
  locked: LockedDispatch,
  transaction: Transaction
): Promise<string> => {
  if (request.action === "REARM") {
    if (locked.parentStatus !== "EM_ANDAMENTO") {
      throw new AppError("ERR_RECONCILIATION_PARENT_NOT_ACTIVE", 409);
    }
    await sequelize.query(
      `UPDATE "CampaignShipping"
          SET "dispatchStatus" = 'PENDING',
              "dispatchKey" = gen_random_uuid(),
              "dispatchStartedAt" = NULL,
              "updatedAt" = :now
        WHERE id = :entityId AND "companyId" = :companyId
          AND "dispatchStatus" = 'PROCESSING'
          AND "dispatchKey" = :expectedDispatchKey`,
      { replacements: { ...request }, transaction }
    );
    return "PENDING";
  }

  const awaitingConfirmation = locked.phase === "CONFIRMATION";
  await sequelize.query(
    awaitingConfirmation
      ? `UPDATE "CampaignShipping"
            SET "dispatchStatus" = 'AWAITING_CONFIRMATION',
                "dispatchKey" = NULL,
                "confirmationRequestedAt" = COALESCE("confirmationRequestedAt", :now),
                "updatedAt" = :now
          WHERE id = :entityId AND "companyId" = :companyId
            AND "dispatchStatus" = 'PROCESSING'
            AND "dispatchKey" = :expectedDispatchKey`
      : `UPDATE "CampaignShipping"
            SET "dispatchStatus" = 'DONE',
                "dispatchKey" = NULL,
                "deliveredAt" = COALESCE("deliveredAt", :now),
                "updatedAt" = :now
          WHERE id = :entityId AND "companyId" = :companyId
            AND "dispatchStatus" = 'PROCESSING'
            AND "dispatchKey" = :expectedDispatchKey`,
    { replacements: { ...request }, transaction }
  );
  if (!awaitingConfirmation) {
    await sequelize.query(
      `UPDATE "Campaigns" campaign
          SET status = 'FINALIZADA', "completedAt" = :now, "updatedAt" = :now
        WHERE campaign.id = :parentId
          AND campaign."companyId" = :companyId
          AND campaign.status = 'EM_ANDAMENTO'
          AND (
            SELECT count(*)
              FROM "ContactListItems" item
             WHERE item."contactListId" = campaign."contactListId"
               AND item."companyId" = campaign."companyId"
               AND item."isWhatsappValid" = TRUE
          ) = (
            SELECT count(*)
              FROM "CampaignShipping" done
             WHERE done."campaignId" = campaign.id
               AND done."companyId" = campaign."companyId"
               AND done."dispatchStatus" = 'DONE'
               AND done."deliveredAt" IS NOT NULL
               AND (
                 (campaign.confirmation = TRUE AND done.confirmation = TRUE)
                 OR
                 (campaign.confirmation IS NOT TRUE AND done.confirmation IS NOT TRUE)
               )
          )`,
      {
        replacements: { ...request, parentId: locked.parentId },
        transaction
      }
    );
  }
  return awaitingConfirmation ? "AWAITING_CONFIRMATION" : "DONE";
};

const ReconcileDispatchService = async (request: Request): Promise<{
  nextStatus: string;
  phase: string;
}> => {
  const reason = request.reason.trim();
  if (!Number.isSafeInteger(request.entityId) || request.entityId <= 0) {
    throw new AppError("ERR_INVALID_RECONCILIATION", 400);
  }
  if (!Number.isSafeInteger(request.companyId) || request.companyId <= 0) {
    throw new AppError("ERR_INVALID_RECONCILIATION", 400);
  }
  if (!Number.isSafeInteger(request.actorUserId) || request.actorUserId <= 0) {
    throw new AppError("ERR_INVALID_RECONCILIATION", 400);
  }
  if (!['SCHEDULE', 'CAMPAIGN_SHIPPING'].includes(request.entityType)) {
    throw new AppError("ERR_INVALID_RECONCILIATION", 400);
  }
  if (!['ACKNOWLEDGE', 'REARM'].includes(request.action)) {
    throw new AppError("ERR_INVALID_RECONCILIATION", 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(request.expectedDispatchKey) || reason.length < 10 || reason.length > 500) {
    throw new AppError("ERR_INVALID_RECONCILIATION", 400);
  }

  const now = request.now || new Date();
  const staleBefore = new Date(
    now.getTime() - getDispatchReconciliationStaleMs()
  );

  return sequelize.transaction(async transaction => {
    const normalized = { ...request, reason, now };
    const actor = await sequelize.query<{ id: number }>(
      `SELECT id FROM "Users"
        WHERE id = :actorUserId AND "companyId" = :companyId
          AND profile = 'admin'
        LIMIT 1`,
      {
        replacements: normalized,
        type: QueryTypes.SELECT,
        transaction
      }
    );
    if (actor.length !== 1) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    const locked = request.entityType === "SCHEDULE"
      ? await lockSchedule(normalized, staleBefore, transaction)
      : await lockCampaignShipping(normalized, staleBefore, transaction);

    if (!locked) throw new AppError("ERR_RECONCILIATION_CONFLICT", 409);

    const nextStatus = request.entityType === "SCHEDULE"
      ? await updateSchedule(normalized, locked, transaction)
      : await updateCampaignShipping(normalized, locked, transaction);

    await sequelize.query(
      `INSERT INTO "DispatchReconciliationAudits" (
         "companyId", "actorUserId", "entityType", "entityId", "parentId",
         phase, action, "previousStatus", "previousStartedAt", "nextStatus",
         reason, "createdAt", "updatedAt"
       ) VALUES (
         :companyId, :actorUserId, :entityType, :entityId, :parentId,
         :phase, :action, :previousStatus, :previousStartedAt, :nextStatus,
         :reason, :now, :now
       )`,
      {
        replacements: {
          ...normalized,
          parentId: locked.parentId,
          phase: locked.phase,
          previousStatus: locked.previousStatus,
          previousStartedAt: locked.previousStartedAt,
          nextStatus
        },
        transaction
      }
    );

    return { nextStatus, phase: locked.phase };
  });
};

export default ReconcileDispatchService;
