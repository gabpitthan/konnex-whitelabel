import { DataTypes, QueryInterface } from "sequelize";

const SCHEDULE_INDEX = "schedules_processing_reconciliation_idx";
const CAMPAIGN_INDEX = "campaign_shipping_processing_reconciliation_idx";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        "DispatchReconciliationAudits",
        {
          id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Companies", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          actorUserId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
          },
          entityType: { type: DataTypes.STRING, allowNull: false },
          entityId: { type: DataTypes.INTEGER, allowNull: false },
          parentId: { type: DataTypes.INTEGER, allowNull: true },
          phase: { type: DataTypes.STRING, allowNull: false },
          action: { type: DataTypes.STRING, allowNull: false },
          previousStatus: { type: DataTypes.STRING, allowNull: false },
          previousStartedAt: { type: DataTypes.DATE, allowNull: false },
          nextStatus: { type: DataTypes.STRING, allowNull: false },
          reason: { type: DataTypes.STRING(500), allowNull: false },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false }
        },
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE "DispatchReconciliationAudits"
           ADD CONSTRAINT "dispatch_reconciliation_entity_type_check"
           CHECK ("entityType" IN ('SCHEDULE', 'CAMPAIGN_SHIPPING')),
           ADD CONSTRAINT "dispatch_reconciliation_action_check"
           CHECK (action IN ('ACKNOWLEDGE', 'REARM')),
           ADD CONSTRAINT "dispatch_reconciliation_transition_check"
           CHECK (
             (
               "entityType" = 'SCHEDULE'
               AND phase = 'MESSAGE'
               AND "previousStatus" = 'PROCESSANDO'
               AND (
                 (action = 'ACKNOWLEDGE' AND "nextStatus" IN ('ENVIADA', 'PENDENTE'))
                 OR (action = 'REARM' AND "nextStatus" = 'PENDENTE')
               )
             )
             OR
             (
               "entityType" = 'CAMPAIGN_SHIPPING'
               AND "previousStatus" = 'PROCESSING'
               AND (
                 (action = 'REARM' AND phase IN ('CONFIRMATION', 'CONTENT') AND "nextStatus" = 'PENDING')
                 OR (action = 'ACKNOWLEDGE' AND phase = 'CONFIRMATION' AND "nextStatus" = 'AWAITING_CONFIRMATION')
                 OR (action = 'ACKNOWLEDGE' AND phase = 'CONTENT' AND "nextStatus" = 'DONE')
               )
             )
           ),
           ADD CONSTRAINT "dispatch_reconciliation_reason_length_check"
           CHECK (char_length(btrim(reason)) BETWEEN 10 AND 500)`,
        { transaction }
      );
      await queryInterface.addIndex(
        "DispatchReconciliationAudits",
        ["companyId", "createdAt", "id"],
        { name: "dispatch_reconciliation_company_created_idx", transaction }
      );
      await queryInterface.addIndex(
        "DispatchReconciliationAudits",
        ["companyId", "entityType", "entityId", "createdAt"],
        { name: "dispatch_reconciliation_entity_history_idx", transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX "${SCHEDULE_INDEX}"
             ON "Schedules" ("companyId", "dispatchStartedAt", id)
        INCLUDE ("contactId", "dispatchKey")
          WHERE status = 'PROCESSANDO'`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX "${CAMPAIGN_INDEX}"
             ON "CampaignShipping" ("companyId", "dispatchStartedAt", id)
        INCLUDE ("campaignId", "contactId", confirmation, "dispatchKey")
          WHERE "dispatchStatus" = 'PROCESSING'`,
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${CAMPAIGN_INDEX}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${SCHEDULE_INDEX}"`,
        { transaction }
      );
      await queryInterface.dropTable("DispatchReconciliationAudits", { transaction });
    });
  }
};
