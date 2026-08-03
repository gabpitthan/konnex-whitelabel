import { handleMsgAck } from "../services/WbotServices/wbotMessageListener";

export default {
  key: `${process.env.DB_NAME}-handleMessageAck`,
  options: {
    priority: 1
  },
  async handle({ data }) {
    const { msg, chat, companyId } = data;
    if (msg === undefined || chat === undefined || companyId === undefined) {
      throw new Error("INVALID_MESSAGE_ACK_JOB_DATA");
    }
    await handleMsgAck(msg, chat, companyId);
  },
};
