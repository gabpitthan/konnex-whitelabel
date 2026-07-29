import { purgeBaileysAuthState } from "../../helpers/useMultiFileAuthState";
import { runSessionLifecycleExclusive } from "../../libs/sessionStartRegistry";
import { removeWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";

export const RunWhatsAppDestructiveOperation = async (
  whatsapp: Whatsapp,
  operation: () => Promise<void>
): Promise<void> => {
  const owner = {
    whatsappId: whatsapp.id,
    companyId: whatsapp.companyId
  };

  await runSessionLifecycleExclusive(owner, async () => {
    const lease = await removeWbot(whatsapp.id, true, undefined, false);
    try {
      if (lease) {
        await purgeBaileysAuthState(whatsapp, lease);
      } else {
        // Cluster mode remains blocked. With no local owner, this is a
        // single-instance maintenance path kept for disconnected sessions.
        await purgeBaileysAuthState(whatsapp);
      }
      await operation();
    } finally {
      await lease?.release().catch(() => undefined);
    }
  });
};
