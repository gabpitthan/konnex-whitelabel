import { QueryInterface } from "sequelize";

/**
 * Setor padrão da primeira empresa, e vínculo do admin com ele.
 *
 * Sem nenhum setor cadastrado, a instalação nova não funciona nos dez primeiros
 * minutos: a mensagem recebida cria um ticket sem setor, a lista "Aguardando"
 * fica vazia, e aceitar abre um seletor de setor sem nenhuma opção. Comprovado
 * em 2026-08-08 no primeiro uso real.
 *
 * O nome é genérico de propósito — quem instala renomeia em Filas.
 * `CreateCompanyService` faz o equivalente para toda empresa criada depois.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const empresaExiste = await queryInterface.rawSelect(
        "Companies",
        { where: { id: 1 } },
        ["id"]
      );
      if (!empresaExiste) return;

      const jaTemSetor = await queryInterface.rawSelect(
        "Queues",
        { where: { companyId: 1 } },
        ["id"]
      );
      if (jaTemSetor) return;

      await queryInterface.bulkInsert(
        "Queues",
        [
          {
            name: "Atendimento",
            color: "#1573E1",
            greetingMessage: "",
            orderQueue: 1,
            companyId: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        { transaction: t }
      );

      // `transaction` é obrigatório aqui: sem ele a consulta não enxerga a linha
      // recém-inserida na mesma transação, o id volta vazio e o vínculo é
      // pulado em silêncio — foi exatamente o que aconteceu no primeiro teste.
      const setorId = await queryInterface.rawSelect(
        "Queues",
        { where: { companyId: 1, name: "Atendimento" }, transaction: t } as any,
        ["id"]
      );
      const adminId = await queryInterface.rawSelect(
        "Users",
        { where: { companyId: 1, profile: "admin" }, transaction: t } as any,
        ["id"]
      );

      // O admin precisa pertencer ao setor para receber a distribuição.
      if (setorId && adminId) {
        await queryInterface.bulkInsert(
          "UserQueues",
          [
            {
              userId: adminId,
              queueId: setorId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          { transaction: t }
        );
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Queues", { companyId: 1, name: "Atendimento" });
  }
};
