import { DataTypes, QueryInterface, Sequelize } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        "Whatsapps",
        "apiTokenLegacyExpiresAt",
        { type: DataTypes.DATE, allowNull: true },
        { transaction }
      );
      await queryInterface.createTable(
        "ApiCredentials",
        {
          id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Companies", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          whatsappId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Whatsapps", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          prefix: { type: DataTypes.STRING(16), allowNull: false },
          digest: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true
          },
          status: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: "active"
          },
          expiresAt: { type: DataTypes.DATE, allowNull: true },
          revokedAt: { type: DataTypes.DATE, allowNull: true },
          createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
          },
          revokedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
          }
        },
        { transaction }
      );
      await queryInterface.addIndex(
        "ApiCredentials",
        ["prefix", "status", "expiresAt"],
        { name: "api_credentials_auth_lookup", transaction }
      );
      await queryInterface.sequelize.query(
        `
          CREATE UNIQUE INDEX "api_credentials_current_owner_unique"
              ON "ApiCredentials" ("whatsappId")
           WHERE status = 'active'
             AND "expiresAt" IS NULL
        `,
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropTable("ApiCredentials", { transaction });
      await queryInterface.removeColumn(
        "Whatsapps",
        "apiTokenLegacyExpiresAt",
        { transaction }
      );
    });
  }
};
