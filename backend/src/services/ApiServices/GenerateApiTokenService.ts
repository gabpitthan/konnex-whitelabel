import { createApiTokenMaterial } from "./ApiTokenCryptoService";

const GenerateApiTokenService = (): string => createApiTokenMaterial().token;

export default GenerateApiTokenService;
