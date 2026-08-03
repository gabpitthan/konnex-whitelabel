import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

const DISPATCH_KEY_INDEX = "schedules_dispatch_key_unique";
const DUE_INDEX = "schedules_due_pending_idx";
const CLAIM_RECOVERY_INDEX = "schedules_claim_recovery_idx";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const ownerless = await queryInterface.sequelize.query(
      `SELECT 1 FROM "Schedules" WHERE "companyId" IS NULL LIMIT 1`,
      { type: QueryTypes.SELECT }
    );

    if (ownerless.length > 0) {
      throw new Error("SCHEDULE_WITHOUT_COMPANY_REQUIRES_RECONCILIATION");
    }

    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `ALTER TABLE "Schedules" ALTER COLUMN "companyId" SET NOT NULL`,
        { transaction }
      );
      await queryInterface.addColumn(
        "Schedules",
        "dispatchKey",
        { type: DataTypes.UUID, allowNull: true },
        { transaction }
      );
      await queryInterface.addColumn(
        "Schedules",
        "dispatchClaimedAt",
        { type: DataTypes.DATE, allowNull: true },
        { transaction }
      );
      await queryInterface.addColumn(
        "Schedules",
        "dispatchStartedAt",
        { type: DataTypes.DATE, allowNull: true },
        { transaction }
      );

      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX "${DISPATCH_KEY_INDEX}"
             ON "Schedules" ("dispatchKey")
          WHERE "dispatchKey" IS NOT NULL`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX "${DUE_INDEX}"
             ON "Schedules" ("sendAt", id)
          WHERE status = 'PENDENTE' AND "sentAt" IS NULL`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX "${CLAIM_RECOVERY_INDEX}"
             ON "Schedules" ("dispatchClaimedAt", id)
          WHERE status = 'AGENDADA' AND "sentAt" IS NULL`,
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${CLAIM_RECOVERY_INDEX}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${DUE_INDEX}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${DISPATCH_KEY_INDEX}"`,
        { transaction }
      );
      await queryInterface.removeColumn("Schedules", "dispatchStartedAt", {
        transaction
      });
      await queryInterface.removeColumn("Schedules", "dispatchClaimedAt", {
        transaction
      });
      await queryInterface.removeColumn("Schedules", "dispatchKey", {
        transaction
      });
      await queryInterface.sequelize.query(
        `ALTER TABLE "Schedules" ALTER COLUMN "companyId" DROP NOT NULL`,
        { transaction }
      );
    });
  }
};
