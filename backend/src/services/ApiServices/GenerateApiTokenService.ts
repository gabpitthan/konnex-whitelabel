import { randomBytes } from "crypto";

const GenerateApiTokenService = (): string =>
  randomBytes(32).toString("base64url");

export default GenerateApiTokenService;
