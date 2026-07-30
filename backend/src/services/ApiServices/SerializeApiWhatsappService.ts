import Whatsapp from "../../models/Whatsapp";

const SerializeApiWhatsappService = (
  whatsapp: Whatsapp
): Record<string, unknown> => {
  const serialized = whatsapp.toJSON() as Record<string, unknown>;
  delete serialized.token;
  return serialized;
};

export default SerializeApiWhatsappService;
