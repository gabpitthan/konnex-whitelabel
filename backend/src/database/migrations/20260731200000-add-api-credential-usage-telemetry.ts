import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        "ApiUsages",
        "legacyAuthCount",
        {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "ApiUsages",
        "digestAuthCount",
        {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn("ApiUsages", "digestAuthCount", {
        transaction
      });
      await queryInterface.removeColumn("ApiUsages", "legacyAuthCount", {
        transaction
      });
    });
  }
};
