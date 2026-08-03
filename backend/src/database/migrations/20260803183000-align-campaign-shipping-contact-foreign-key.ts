import { QueryInterface } from "sequelize";

const CONTACT_CONSTRAINT = "CampaignShipping_contactId_fkey";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           DROP CONSTRAINT IF EXISTS "${CONTACT_CONSTRAINT}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           ADD CONSTRAINT "${CONTACT_CONSTRAINT}"
           FOREIGN KEY ("contactId") REFERENCES "ContactListItems" (id)
           ON UPDATE CASCADE ON DELETE CASCADE`,
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           DROP CONSTRAINT IF EXISTS "${CONTACT_CONSTRAINT}"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "CampaignShipping"
           ADD CONSTRAINT "${CONTACT_CONSTRAINT}"
           FOREIGN KEY ("contactId") REFERENCES "ContactListItems" (id)
           ON UPDATE SET NULL ON DELETE SET NULL`,
        { transaction }
      );
    });
  }
};
