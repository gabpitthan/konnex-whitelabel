import { Request, Response } from "express";
import { removeWbot } from "../libs/wbot";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import Whatsapp from "../models/Whatsapp";
import { purgeBaileysAuthState } from "../helpers/useMultiFileAuthState";
import AppError from "../errors/AppError";

const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  // console.log("STARTING SESSION", whatsappId)
  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
  await StartWhatsAppSession(whatsapp, companyId);


  return res.status(200).json({ message: "Starting session." });
};

const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  // const { whatsapp } = await UpdateWhatsAppService({
  //   whatsappId,
  //   companyId,
  //   whatsappData: { session: "", requestQR: true }
  // });
  const whatsapp = await Whatsapp.findOne({ where: { id: whatsappId, companyId } });

  if (!whatsapp) throw new AppError("ERR_WAPP_NOT_FOUND", 404);

  await removeWbot(whatsapp.id);
  await purgeBaileysAuthState(whatsapp);
  await whatsapp.update({
    session: "",
    qrcode: "",
    status: "DISCONNECTED"
  });
  
  if (whatsapp.channel === "whatsapp") {
    await StartWhatsAppSession(whatsapp, companyId);
  }

  return res.status(200).json({ message: "Starting session." });
};

const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  console.log("DISCONNECTING SESSION", whatsappId)
  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);


  if (whatsapp.channel === "whatsapp") {
    await removeWbot(whatsapp.id);
    await purgeBaileysAuthState(whatsapp);
    await DeleteBaileysService(whatsappId);
    await whatsapp.update({
      session: "",
      qrcode: "",
      status: "DISCONNECTED"
    });
  }

  return res.status(200).json({ message: "Session disconnected." });
};

export default { store, remove, update };
