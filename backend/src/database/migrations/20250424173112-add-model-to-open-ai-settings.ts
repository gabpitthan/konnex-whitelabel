import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Prompts", "model", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "gpt-3.5-turbo-1106",
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Prompts", "model");
  },
};