import { QueryInterface, QueryTypes } from "sequelize";

const WHATSAPP_TOKEN_INDEX = "whatsapps_api_token_unique";
const API_USAGE_INDEX = "api_usages_company_date_unique";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const duplicateTokens = await queryInterface.sequelize.query(
      `
        SELECT 1
          FROM "Whatsapps"
         WHERE token IS NOT NULL
           AND btrim(token) <> ''
         GROUP BY token
        HAVING COUNT(*) > 1
         LIMIT 1
      `,
      { type: QueryTypes.SELECT }
    );
    if (duplicateTokens.length > 0) {
      throw new Error("DUPLICATE_API_TOKENS_REQUIRE_MANUAL_ROTATION");
    }

    const duplicateUsage = await queryInterface.sequelize.query(
      `
        SELECT 1
          FROM "ApiUsages"
         WHERE "dateUsed" IS NOT NULL
         GROUP BY "companyId", "dateUsed"
        HAVING COUNT(*) > 1
         LIMIT 1
      `,
      { type: QueryTypes.SELECT }
    );
    if (duplicateUsage.length > 0) {
      throw new Error("DUPLICATE_API_USAGE_REQUIRES_MANUAL_RECONCILIATION");
    }

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "${WHATSAPP_TOKEN_INDEX}"
          ON "Whatsapps" (token)
       WHERE token IS NOT NULL
         AND btrim(token) <> ''
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "${API_USAGE_INDEX}"
          ON "ApiUsages" ("companyId", "dateUsed")
       WHERE "dateUsed" IS NOT NULL
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${API_USAGE_INDEX}"`
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${WHATSAPP_TOKEN_INDEX}"`
    );
  }
};
