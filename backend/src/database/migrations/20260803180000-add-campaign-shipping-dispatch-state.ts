import { DataTypes, QueryInterface, QueryTypes } from "sequelize";

const OWNER_CONSTRAINT = "campaign_shipping_company_fk";
const UNIQUE_CONTACT_INDEX = "campaign_shipping_company_campaign_contact_unique";
const UNIQUE_DISPATCH_INDEX = "campaign_shipping_dispatch_key_unique";
const PENDING_INDEX = "campaign_shipping_pending_dispatch_idx";
const STATUS_CONSTRAINT = "campaign_shipping_dispatch_status_check";
const STATE_CONSTRAINT = "campaign_shipping_dispatch_state_check";
const CAMPAIGN_OWNER_INDEX = "campaigns_id_company_unique";
const CAMPAIGN_OWNER_CONSTRAINT = "campaign_shipping_campaign_company_fk";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const invalid = await queryInterface.sequelize.query(
      `
        SELECT 1
          FROM "CampaignShipping" shipping
          LEFT JOIN "Campaigns" campaign ON campaign.id = shipping."campaignId"
         WHERE campaign.id IS NULL OR shipping."contactId" IS NULL
         LIMIT 1
      `,
      { type: QueryTypes.SELECT }
    );
    if (invalid.length > 0) {
      throw new Error("CAMPAIGN_SHIPPING_OWNER_REQUIRES_RECONCILIATION");
    }

    const duplicates = await queryInterface.sequelize.query(
      `
        SELECT 1
          FROM "CampaignShipping"
         GROUP BY "campaignId", "contactId"
        HAVING COUNT(*) > 1
         LIMIT 1
      `,
      { type: QueryTypes.SELECT }
    );
    if (duplicates.length > 0) {
      throw new Error("CAMPAIGN_SHIPPING_DUPLICATES_REQUIRE_RECONCILIATION");
    }

    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        "CampaignShipping",
        "companyId",
        { type: DataTypes.INTEGER, allowNull: true },
        { transaction }
      );
      await queryInterface.addColumn(
        "CampaignShipping",
        "dispatchKey",
        { type: DataTypes.UUID, allowNull: true },
        { transaction }
      );
      await queryInterface.addColumn(
        "CampaignShipping",
        "dispatchStatus",
        { type: DataTypes.STRING, allowNull: true },
        { transaction }
      );
      await queryInterface.addColumn(
        "CampaignShipping",
        "dispatchStartedAt",
        { type: DataTypes.DATE, allowNull: true },
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "CampaignShipping" shipping
             SET "companyId" = campaign."companyId",
                 "dispatchStatus" = CASE
                   WHEN shipping."confirmationRequestedAt" IS NOT NULL
                        AND shipping.confirmation IS NULL
                     THEN 'AWAITING_CONFIRMATION'
                   WHEN shipping."deliveredAt" IS NOT NULL THEN 'DONE'
                   ELSE 'PENDING'
                 END,
                 "dispatchKey" = CASE
                   WHEN shipping."deliveredAt" IS NULL
                        AND shipping."confirmationRequestedAt" IS NULL
                     THEN gen_random_uuid()
                   ELSE NULL
                 END,
                 "deliveredAt" = CASE
                   WHEN shipping."confirmationRequestedAt" IS NOT NULL
                        AND shipping.confirmation IS NULL
                     THEN NULL
                   ELSE shipping."deliveredAt"
                 END
            FROM "Campaigns" campaign
           WHERE campaign.id = shipping."campaignId"
        `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "${CAMPAIGN_OWNER_INDEX}"
             ON "Campaigns" (id, "companyId")`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           ADD CONSTRAINT "${CAMPAIGN_OWNER_CONSTRAINT}"
           FOREIGN KEY ("campaignId", "companyId")
           REFERENCES "Campaigns" (id, "companyId")
           ON UPDATE CASCADE ON DELETE CASCADE`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           ALTER COLUMN "companyId" SET NOT NULL,
           ALTER COLUMN "contactId" SET NOT NULL,
           ALTER COLUMN "dispatchStatus" SET NOT NULL`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           ADD CONSTRAINT "${OWNER_CONSTRAINT}"
           FOREIGN KEY ("companyId") REFERENCES "Companies" (id)
           ON UPDATE CASCADE ON DELETE CASCADE`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           ADD CONSTRAINT "${STATUS_CONSTRAINT}"
           CHECK ("dispatchStatus" IN (
             'PENDING', 'PROCESSING', 'AWAITING_CONFIRMATION',
             'DONE', 'ERROR', 'CANCELLED'
           ))`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           ADD CONSTRAINT "${STATE_CONSTRAINT}"
           CHECK (
             ("dispatchStatus" = 'PENDING' AND "dispatchKey" IS NOT NULL)
             OR ("dispatchStatus" = 'PROCESSING'
                 AND "dispatchKey" IS NOT NULL
                 AND "dispatchStartedAt" IS NOT NULL)
             OR ("dispatchStatus" = 'AWAITING_CONFIRMATION'
                 AND "dispatchKey" IS NULL
                 AND "confirmationRequestedAt" IS NOT NULL)
             OR ("dispatchStatus" = 'DONE'
                 AND "dispatchKey" IS NULL
                 AND "deliveredAt" IS NOT NULL)
             OR ("dispatchStatus" IN ('ERROR', 'CANCELLED')
                 AND "dispatchKey" IS NULL)
           )`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX "${UNIQUE_CONTACT_INDEX}"
             ON "CampaignShipping" ("companyId", "campaignId", "contactId")`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX "${UNIQUE_DISPATCH_INDEX}"
             ON "CampaignShipping" ("companyId", "dispatchKey")
          WHERE "dispatchKey" IS NOT NULL`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX "${PENDING_INDEX}"
             ON "CampaignShipping" ("companyId", "updatedAt", id)
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
        `DROP INDEX IF EXISTS "${UNIQUE_DISPATCH_INDEX}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${UNIQUE_CONTACT_INDEX}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping" DROP CONSTRAINT IF EXISTS "${STATE_CONSTRAINT}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping" DROP CONSTRAINT IF EXISTS "${STATUS_CONSTRAINT}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping" DROP CONSTRAINT IF EXISTS "${OWNER_CONSTRAINT}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping" DROP CONSTRAINT IF EXISTS "${CAMPAIGN_OWNER_CONSTRAINT}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${CAMPAIGN_OWNER_INDEX}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping" ALTER COLUMN "contactId" DROP NOT NULL`,
        { transaction }
      );
      await queryInterface.removeColumn("CampaignShipping", "dispatchStartedAt", { transaction });
      await queryInterface.removeColumn("CampaignShipping", "dispatchStatus", { transaction });
      await queryInterface.removeColumn("CampaignShipping", "dispatchKey", { transaction });
      await queryInterface.removeColumn("CampaignShipping", "companyId", { transaction });
    });
  }
};
