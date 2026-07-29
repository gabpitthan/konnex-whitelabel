import { Transaction } from "sequelize";

import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";

export interface WhatsappContactData {
  name: string;
  number: string;
  isGroup: boolean;
  companyId: number;
  remoteJid: string;
  whatsappId: number;
  profilePicUrl?: string;
  email?: string;
  acceptAudioMessage?: boolean;
}

interface Request {
  contactData: WhatsappContactData;
  transaction: Transaction;
}

const UpsertWhatsappContactService = async ({
  contactData,
  transaction
}: Request): Promise<Contact> => {
  const {
    companyId,
    whatsappId,
    isGroup,
    remoteJid,
    profilePicUrl,
    email = "",
    acceptAudioMessage = true
  } = contactData;
  const number = isGroup
    ? contactData.number
    : contactData.number.replace(/[^0-9]/g, "");

  if (
    !Number.isInteger(companyId) ||
    companyId <= 0 ||
    !Number.isInteger(whatsappId) ||
    whatsappId <= 0 ||
    !number ||
    !remoteJid
  ) {
    throw new Error("ERR_WHATSAPP_CONTACT_INVALID_OWNER");
  }

  const [contact, created] = await Contact.findOrCreate({
    where: { number, companyId },
    defaults: {
      name: contactData.name || number,
      number,
      email,
      isGroup,
      companyId,
      channel: "whatsapp",
      acceptAudioMessage,
      remoteJid,
      profilePicUrl: profilePicUrl || "",
      urlPicture: "",
      whatsappId
    },
    transaction
  });

  if (!created) {
    const values: Partial<Contact> = {
      remoteJid,
      isGroup,
      whatsappId
    };

    if (profilePicUrl) values.profilePicUrl = profilePicUrl;
    if (contact.name === number && contactData.name) {
      values.name = contactData.name;
    }

    await contact.update(values, { transaction });
  }

  await contact.reload({ transaction });
  transaction.afterCommit(() => {
    getIO()
      .of(String(companyId))
      .emit(`company-${companyId}-contact`, {
        action: created ? "create" : "update",
        contact
      });
  });

  return contact;
};

export default UpsertWhatsappContactService;
