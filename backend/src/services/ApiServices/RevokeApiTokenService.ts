import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import ApiCredential from "../../models/ApiCredential";
import Whatsapp from "../../models/Whatsapp";

const RevokeApiTokenService = async (
  whatsappId: string | number,
  companyId: number,
  revokedBy?: number
): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const whatsapp = await Whatsapp.findOne({
      where: { id: whatsappId, companyId, channel: "whatsapp" },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!whatsapp) throw new AppError("ERR_NO_WAPP_FOUND", 404);

    const revokedAt = new Date();
    await ApiCredential.update(
      {
        status: "revoked",
        revokedAt,
        revokedBy: revokedBy || null,
        expiresAt: revokedAt
      },
      {
        where: {
          whatsappId: whatsapp.id,
          status: { [Op.in]: ["active", "grace"] }
        },
        transaction
      }
    );
    await whatsapp.update(
      { token: "", apiTokenLegacyExpiresAt: revokedAt },
      { transaction }
    );
  });
};

export default RevokeApiTokenService;
