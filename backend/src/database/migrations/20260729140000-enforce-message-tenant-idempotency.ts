import { QueryInterface, QueryTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const duplicates = (await queryInterface.sequelize.query(
      `SELECT COUNT(*)::integer AS count
       FROM (
         SELECT "companyId", wid
         FROM "Messages"
         WHERE wid IS NOT NULL
         GROUP BY "companyId", wid
         HAVING COUNT(*) > 1
       ) duplicated_messages`,
      { type: QueryTypes.SELECT }
    )) as Array<{ count: number }>;

    if (Number(duplicates[0]?.count || 0) > 0) {
      throw new Error("MESSAGE_TENANT_WID_DUPLICATES_REQUIRE_RECONCILIATION");
    }

    await queryInterface.removeIndex("Messages", "idx_message_company_id");
    await queryInterface.addConstraint("Messages", ["companyId", "wid"], {
      type: "unique",
      name: "messages_company_wid_unique"
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeConstraint(
      "Messages",
      "messages_company_wid_unique"
    );
    await queryInterface.addIndex("Messages", ["companyId"], {
      name: "idx_message_company_id"
    });
  }
};
