import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import AssociateWhatsappQueue from "./AssociateWhatsappQueue";
import sequelize from "../../database";
import IssueApiCredentialService from "../ApiServices/IssueApiCredentialService";

interface Request {
  name: string;
  companyId: number;
  queueIds?: number[];
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  status?: string;
  isDefault?: boolean;
  token?: string;
  provider?: string;
  facebookUserId?: string;
  facebookUserToken?: string;
  tokenMeta?: string;
  channel?: string;
  facebookPageUserId?: string;
  maxUseBotQueues?: string;
  timeUseBotQueues?: string;
  expiresTicket?: number;
  allowGroup?: boolean;
  sendIdQueue?: number;
  timeSendQueue?: number;
  timeInactiveMessage?: string;
  inactiveMessage?: string;
  maxUseBotQueuesNPS?: number;
  expiresTicketNPS?: number;
  whenExpiresTicket?: string;
  expiresInactiveMessage?: string;
  groupAsTicket?: string;
  importOldMessages?: string;
  importRecentMessages?:string;
  importOldMessagesGroups?: boolean;
  closedTicketsPostImported?: boolean;
  timeCreateNewTicket?: number;
  integrationId?: number;
  schedules?: any[];
  promptId?: number;
  collectiveVacationMessage?: string;
  collectiveVacationStart?: string;
  collectiveVacationEnd?: string;
  queueIdImportMessages?: number;
  flowIdNotPhrase?: number;
  flowIdWelcome?: number;
  createdBy?: number;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
  apiToken?: string;
}

const CreateWhatsAppService = async ({
  name,
  status = "OPENING",
  queueIds = [],
  greetingMessage,
  complationMessage,
  outOfHoursMessage,
  isDefault = false,
  companyId,
  token = "",
  provider = "beta",
  facebookUserId,
  facebookUserToken,
  facebookPageUserId,
  tokenMeta,
  channel = "whatsapp",
  maxUseBotQueues,
  timeUseBotQueues,
  expiresTicket,
  allowGroup = false,
  timeSendQueue,
  sendIdQueue,
  timeInactiveMessage,
  inactiveMessage,
  ratingMessage,
  maxUseBotQueuesNPS,
  expiresTicketNPS,
  whenExpiresTicket,
  expiresInactiveMessage,
  groupAsTicket,
  importOldMessages,
  importRecentMessages,
  closedTicketsPostImported,
  importOldMessagesGroups,
  timeCreateNewTicket,
  integrationId,
  schedules,
  promptId,
  collectiveVacationEnd,
  collectiveVacationMessage,
  collectiveVacationStart,
  queueIdImportMessages,
  flowIdNotPhrase,
  flowIdWelcome,
  createdBy
}: Request): Promise<Response> => {
  const company = await Company.findOne({
    where: {
      id: companyId,
    },
    include: [{ model: Plan, as: "plan" }]
  });

  if (company !== null) {
    const whatsappCount = await Whatsapp.count({
      where: {
        companyId,
        channel: channel
      }
    });

    if (whatsappCount >= company.plan.connections) {
      throw new AppError(
        `Número máximo de conexões já alcançado: ${whatsappCount}`
      );
    }
  }

  const schema = Yup.object().shape({
    name: Yup.string()
      .required()
      .min(2)
      .test(
        "Check-name",
        "Esse nome já está sendo utilizado por outra conexão",
        async value => {
          if (!value) return false;
          const nameExists = await Whatsapp.findOne({
            where: { name: value, channel: channel, companyId }
          });
          return !nameExists;
        }
      ),
    isDefault: Yup.boolean().required()
  });

  try {
    await schema.validate({ name, status, isDefault });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const whatsappFound = await Whatsapp.findOne({ where: { companyId } });

  isDefault = channel === "whatsapp" ? !whatsappFound : false

  let oldDefaultWhatsapp: Whatsapp | null = null;

  if (channel === 'whatsapp' && isDefault) {
    oldDefaultWhatsapp = await Whatsapp.findOne({
      where: { isDefault: true, companyId, channel: channel }
    });
    if (oldDefaultWhatsapp) {
      await oldDefaultWhatsapp.update({ isDefault: false, companyId });
    }
  }

  if (queueIds.length > 1 && !greetingMessage) {
    throw new AppError("ERR_WAPP_GREETING_REQUIRED");
  }

  const whatsappData = {
      name,
      status,
      greetingMessage,
      complationMessage,
      outOfHoursMessage,
      ratingMessage,
      isDefault,
      companyId,
      token: channel === "whatsapp" ? "" : token || "",
      provider,
      channel,
      facebookUserId,
      facebookUserToken,
      facebookPageUserId,
      tokenMeta,
      maxUseBotQueues,
      timeUseBotQueues,
      expiresTicket,
      allowGroup,
      timeSendQueue,
      sendIdQueue,
      timeInactiveMessage,
      inactiveMessage,
      maxUseBotQueuesNPS,
      expiresTicketNPS,
      whenExpiresTicket,
      expiresInactiveMessage,
      groupAsTicket,
      importOldMessages,
      importRecentMessages,
      closedTicketsPostImported,
      importOldMessagesGroups,
      timeCreateNewTicket,
      integrationId,
      schedules,
      promptId,
      collectiveVacationEnd,
      collectiveVacationMessage,
      collectiveVacationStart,
      queueIdImportMessages,
      flowIdNotPhrase,
      flowIdWelcome
  };

  let apiToken: string | undefined;
  const whatsapp =
    channel === "whatsapp"
      ? await sequelize.transaction(async transaction => {
          const created = await Whatsapp.create(whatsappData, {
            include: ["queues"],
            transaction
          });
          apiToken = await IssueApiCredentialService({
            companyId,
            whatsappId: created.id,
            createdBy,
            transaction
          });
          return created;
        })
      : await Whatsapp.create(whatsappData, { include: ["queues"] });

  await AssociateWhatsappQueue(whatsapp, queueIds);

  return { whatsapp, oldDefaultWhatsapp, apiToken };
};

export default CreateWhatsAppService;
