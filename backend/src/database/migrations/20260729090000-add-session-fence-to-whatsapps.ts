import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      "CREATE SEQUENCE IF NOT EXISTS whatsapp_session_fence_seq"
    );
    await queryInterface.addColumn("Whatsapps", "sessionFence", {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("Whatsapps", "sessionFence");
    await queryInterface.sequelize.query(
      "DROP SEQUENCE IF EXISTS whatsapp_session_fence_seq"
    );
  }
};
