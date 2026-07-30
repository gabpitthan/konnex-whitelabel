import AppError from "../../errors/AppError";
import sequelize from "../../database";
import ApiCredential from "../../models/ApiCredential";
import Whatsapp from "../../models/Whatsapp";
import IssueApiCredentialService from "./IssueApiCredentialService";

const RotateApiTokenService = async (
  whatsappId: string | number,
  companyId: number,
  createdBy?: number
): Promise<string> => {
  const configuredGrace = Number(process.env.API_TOKEN_ROTATION_GRACE_SECONDS);
  const graceSeconds =
    Number.isInteger(configuredGrace) &&
    configuredGrace >= 60 &&
    configuredGrace <= 86_400
      ? configuredGrace
      : 900;
  const graceExpiresAt = new Date(Date.now() + graceSeconds * 1000);

  return sequelize.transaction(async transaction => {
    const whatsapp = await Whatsapp.findOne({
      where: { id: whatsappId, companyId, channel: "whatsapp" },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!whatsapp) throw new AppError("ERR_NO_WAPP_FOUND", 404);

    await ApiCredential.update(
      {
        expiresAt: graceExpiresAt,
        status: "grace",
        revokedBy: createdBy || null
      },
      {
        where: {
          whatsappId: whatsapp.id,
          status: "active",
          expiresAt: null
        },
        transaction
      }
    );

    if (whatsapp.token && !whatsapp.apiTokenLegacyExpiresAt) {
      await whatsapp.update(
        { apiTokenLegacyExpiresAt: graceExpiresAt },
        { transaction }
      );
    }

    return IssueApiCredentialService({
      companyId,
      whatsappId: whatsapp.id,
      createdBy,
      transaction
    });
  });
};

export default RotateApiTokenService;
