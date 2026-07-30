import { Op } from "sequelize";
import ApiCredential from "../../models/ApiCredential";
import {
  digestApiToken,
  parseApiTokenPrefix,
  safelyMatchesDigest
} from "./ApiTokenCryptoService";

const ResolveApiCredentialService = async (
  token: string
): Promise<ApiCredential | null> => {
  const prefix = parseApiTokenPrefix(token);
  if (!prefix) return null;

  const candidates = await ApiCredential.findAll({
    where: {
      prefix,
      status: { [Op.in]: ["active", "grace"] },
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } }
      ]
    },
    attributes: ["id", "companyId", "whatsappId", "digest", "expiresAt"]
  });
  const candidateDigest = digestApiToken(token);
  return (
    candidates.find(candidate =>
      safelyMatchesDigest(candidateDigest, candidate.digest)
    ) || null
  );
};

export default ResolveApiCredentialService;
