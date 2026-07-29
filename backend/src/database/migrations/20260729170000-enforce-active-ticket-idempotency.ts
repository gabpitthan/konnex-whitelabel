import { QueryInterface, QueryTypes } from "sequelize";

const INDEX_NAME = "tickets_active_contact_company_whatsapp_unique";
const ACTIVE_STATUSES = "'open', 'pending', 'group', 'nps', 'lgpd'";
const ACTIVE_WHATSAPP_PREDICATE =
  `channel = 'whatsapp' AND status IN (${ACTIVE_STATUSES})`;

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const duplicates = await queryInterface.sequelize.query(
      `
        SELECT 1
          FROM "Tickets"
         WHERE ${ACTIVE_WHATSAPP_PREDICATE}
         GROUP BY "companyId", "contactId", "whatsappId"
        HAVING COUNT(*) > 1
         LIMIT 1
      `,
      { type: QueryTypes.SELECT }
    );

    if (duplicates.length > 0) {
      throw new Error("ACTIVE_TICKET_DUPLICATES_REQUIRE_MANUAL_RECONCILIATION");
    }

    const invalidOwners = await queryInterface.sequelize.query(
      `
        SELECT 1
          FROM "Tickets"
         WHERE ${ACTIVE_WHATSAPP_PREDICATE}
           AND (
             "companyId" IS NULL
             OR "contactId" IS NULL
             OR "whatsappId" IS NULL
           )
         LIMIT 1
      `,
      { type: QueryTypes.SELECT }
    );

    if (invalidOwners.length > 0) {
      throw new Error("ACTIVE_WHATSAPP_TICKET_WITHOUT_OWNER");
    }

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "${INDEX_NAME}"
          ON "Tickets" ("companyId", "contactId", "whatsappId")
       WHERE ${ACTIVE_WHATSAPP_PREDICATE}
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${INDEX_NAME}"`
    );
  }
};
