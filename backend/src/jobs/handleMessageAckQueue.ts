import { handleMsgAck } from "../services/WbotServices/wbotMessageListener";

export default {
  key: `${process.env.DB_NAME}-handleMessageAck`,
  options: {
    priority: 1
  },
  async handle({ data }) {
    try {
      const { msg, chat, companyId } = data;
      await handleMsgAck(msg, chat, companyId);
    } catch (error) {
      console.log("error", error)
    }
  },
};
