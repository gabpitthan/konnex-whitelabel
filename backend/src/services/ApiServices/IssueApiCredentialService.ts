import { Transaction } from "sequelize";
import ApiCredential from "../../models/ApiCredential";
import { createApiTokenMaterial } from "./ApiTokenCryptoService";

interface Request {
  companyId: number;
  whatsappId: number;
  createdBy?: number;
  transaction: Transaction;
}

const IssueApiCredentialService = async ({
  companyId,
  whatsappId,
  createdBy,
  transaction
}: Request): Promise<string> => {
  const material = createApiTokenMaterial();
  await ApiCredential.create(
    {
      companyId,
      whatsappId,
      prefix: material.prefix,
      digest: material.digest,
      status: "active",
      createdBy: createdBy || null
    },
    { transaction }
  );
  return material.token;
};

export default IssueApiCredentialService;
