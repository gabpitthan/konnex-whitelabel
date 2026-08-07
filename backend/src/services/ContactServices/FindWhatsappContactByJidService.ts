import { Op } from "sequelize";

import Contact from "../../models/Contact";
import { isLidJid, normalizeJid } from "../../helpers/ResolveContactJid";

/**
 * Localiza um contato **ja existente** a partir de um JID cru, escopado ao
 * tenant, e nunca cria.
 *
 * Existe por causa de eventos do Baileys que trazem so o JID e nenhuma forma de
 * descobrir o telefone. `contacts.update` de foto de perfil, por exemplo, chega
 * como `{ id, imgUrl }` e mais nada (`Socket/messages-recv.js`): quando a conta
 * usa LID, `id` e `<numero>@lid` e nao existe `senderPn` para resolver. Criar
 * contato a partir dai gravava o LID no campo `number` — foi assim que o
 * contato `100236483629289@lid` apareceu em producao horas depois da correcao
 * do caminho da mensagem.
 *
 * A busca por `remoteJid` vem antes da busca por `number` de proposito: um LID
 * e uma sequencia de digitos como qualquer outra, e procura-lo em `number`
 * casaria com um telefone homonimo de outro contato.
 */
const FindWhatsappContactByJidService = async (
  jid: string | null | undefined,
  companyId: number
): Promise<Contact | null> => {
  if (!jid) return null;
  if (!Number.isInteger(companyId) || companyId <= 0) return null;

  const normalized = normalizeJid(jid);
  if (!normalized) return null;

  const jidCandidates =
    normalized === jid ? [normalized] : [normalized, jid];

  const byRemoteJid = await Contact.findOne({
    where: { companyId, remoteJid: { [Op.in]: jidCandidates } }
  });

  if (byRemoteJid) return byRemoteJid;

  // Um LID nao e telefone: sem correspondencia por JID, nao ha identidade.
  if (isLidJid(normalized)) return null;

  const isGroup = normalized.endsWith("@g.us");
  const number = isGroup
    ? normalized.replace("@g.us", "")
    : normalized.replace(/\D/g, "");

  if (!number) return null;

  return Contact.findOne({ where: { companyId, number } });
};

export default FindWhatsappContactByJidService;
