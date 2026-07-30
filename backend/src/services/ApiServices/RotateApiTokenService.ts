import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import GenerateApiTokenService from "./GenerateApiTokenService";

const RotateApiTokenService = async (
  whatsappId: string | number,
  companyId: number
): Promise<string> => {
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId, companyId, channel: "whatsapp" }
  });
  if (!whatsapp) throw new AppError("ERR_NO_WAPP_FOUND", 404);

  const token = GenerateApiTokenService();
  await whatsapp.update({ token });
  return token;
};

export default RotateApiTokenService;
