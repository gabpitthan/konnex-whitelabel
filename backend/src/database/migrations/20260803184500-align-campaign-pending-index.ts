import { QueryInterface } from "sequelize";

const PENDING_INDEX = "campaign_shipping_pending_dispatch_idx";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${PENDING_INDEX}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX "${PENDING_INDEX}"
             ON "CampaignShipping" ("updatedAt", id)
        INCLUDE ("companyId", "campaignId", "dispatchKey")
          WHERE "dispatchStatus" = 'PENDING'`,
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${PENDING_INDEX}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX "${PENDING_INDEX}"
             ON "CampaignShipping" ("companyId", "updatedAt", id)
          WHERE "dispatchStatus" = 'PENDING'`,
        { transaction }
      );
    });
  }
};
