import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import User from "../../models/User";
import Queue from "../../models/Queue";
import sequelize from "../../database";
import CompaniesSettings from "../../models/CompaniesSettings";

interface CompanyData {
  name: string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  dueDate?: string;
  recurrence?: string;
  document?: string;
  paymentMethod?: string;
  password?: string;
  companyUserName?: string;
}

const CreateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const {
    name,
    phone,
    password,
    email,
    status,
    planId,
    dueDate,
    recurrence,
    document,
    paymentMethod,
    companyUserName
  } = companyData;

  const companySchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_COMPANY_INVALID_NAME")
      .required("ERR_COMPANY_INVALID_NAME")
  });

  try {
    await companySchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const t = await sequelize.transaction();

  try {
    const company = await Company.create({
      name,
      phone,
      email,
      status,
      planId,
      dueDate,
      recurrence,
      document,
      paymentMethod
    },
      { transaction: t }
    );

    const user = await User.create({
      name: companyUserName ? companyUserName : name,
      email: company.email,
      password: password ? password : "mudar123",
      profile: "admin",
      companyId: company.id
    },
      { transaction: t }
    );

    /**
     * Setor padrão.
     *
     * Sem nenhum setor cadastrado, a mensagem que chega cria um ticket sem
     * setor: a lista "Aguardando" fica vazia e o aceite abre um seletor sem
     * opção. Foi o que travou o primeiro uso real em 2026-08-08, e é o que
     * travaria todo comprador nos dez primeiros minutos.
     *
     * O nome é genérico de propósito — quem instala renomeia em Filas.
     */
    const setorPadrao = await Queue.create({
      name: "Atendimento",
      color: "#1573E1",
      greetingMessage: "",
      orderQueue: 1,
      // NOT NULL sem default no modelo: omitir derruba a criação da empresa
      // inteira com notNull Violation. Descoberto criando uma empresa de teste.
      tempoRoteador: 0,
      ativarRoteador: false,
      closeTicket: false,
      companyId: company.id
    },
      { transaction: t }
    );

    // O admin precisa pertencer ao setor para receber a distribuição.
    await user.$add("queues", setorPadrao, { transaction: t });

    const settings = await CompaniesSettings.create({
          companyId: company.id,
          hoursCloseTicketsAuto: "9999999999",
          chatBotType: "text",
          acceptCallWhatsapp: "enabled",
          userRandom: "enabled",
          sendGreetingMessageOneQueues: "enabled",
          sendSignMessage: "enabled",
          sendFarewellWaitingTicket: "disabled",
          userRating: "disabled",
          // Nasce desligada: ligada por padrao com a mensagem em branco,
          // aceitar um ticket disparava uma mensagem vazia ao cliente.
          // Ligue depois de escrever a saudacao.
          sendGreetingAccepted: "disabled",
          CheckMsgIsGroup: "enabled",
          sendQueuePosition: "disabled",
          scheduleType: "disabled",
          acceptAudioMessageContact: "enabled",
          sendMsgTransfTicket:"disabled",
          enableLGPD: "disabled",
          requiredTag: "disabled",
          lgpdDeleteMessage: "disabled",
          lgpdHideNumber: "disabled",
          lgpdConsent: "disabled",
          lgpdLink:"",
          lgpdMessage:"",
          createdAt: new Date(),
          updatedAt: new Date(),
          closeTicketOnTransfer: false,
          DirectTicketsToWallets: false
    },{ transaction: t })
    
    await t.commit();

    return company;
  } catch (error) {
    await t.rollback();
    throw new AppError("Não foi possível criar a empresa!", error);
  }
};

export default CreateCompanyService;