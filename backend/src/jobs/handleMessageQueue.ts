import { getWbot } from "../libs/wbot";
import { handleMessage } from "../services/WbotServices/wbotMessageListener";

export default {
    key: `${process.env.DB_NAME}-handleMessage`,

    async handle({ data }) {
        const { message, wbot, companyId } = data;

        if (message === undefined || wbot === undefined || companyId === undefined) {
            throw new Error("INVALID_MESSAGE_JOB_DATA");
        }

        const w = getWbot(wbot);

        if (!w) {
            throw new Error("WHATSAPP_SESSION_NOT_FOUND");
        }

        await handleMessage(message, w, companyId);
    },
};
