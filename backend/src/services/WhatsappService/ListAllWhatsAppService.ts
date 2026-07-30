import { FindOptions } from "sequelize/types";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  session?: number | string;
  companyId: number;
}

const ListAllWhatsAppsService = async ({
  session,
  companyId
}: Request): Promise<Whatsapp[]> => {
  const options: FindOptions = {
    where: { companyId },
    attributes: { exclude: ["token"] },
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage"]
      }
    ]
  };

  if (session !== undefined && session == 0) {
    options.attributes = { exclude: ["session", "token"] };
  }

  const whatsapps = await Whatsapp.findAll(options);

  return whatsapps;
};

export default ListAllWhatsAppsService;
