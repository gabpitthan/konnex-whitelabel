import {
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual
} from "crypto";
import AppError from "../../errors/AppError";

const TOKEN_PATTERN = /^wk_([a-f0-9]{16})_([A-Za-z0-9_-]{43})$/;

const getPepper = (): string | Buffer => {
  const pepper = process.env.API_TOKEN_PEPPER;
  if (pepper && Buffer.byteLength(pepper) >= 32) return pepper;

  const masterKey = process.env.MASTER_KEY;
  if (masterKey && Buffer.byteLength(masterKey) >= 32) {
    return Buffer.from(
      hkdfSync(
        "sha256",
        masterKey,
        "whitelabel-whaticket",
        "api-token-pepper-v1",
        32
      )
    );
  }
  throw new AppError("ERR_API_TOKEN_PEPPER_UNAVAILABLE", 503);
};

export const parseApiTokenPrefix = (token: string): string | null =>
  TOKEN_PATTERN.exec(token)?.[1] || null;

export const digestApiToken = (token: string): string =>
  createHmac("sha256", getPepper()).update(token).digest("hex");

export const safelyMatchesDigest = (
  candidateDigest: string,
  storedDigest: string
): boolean => {
  const candidate = Buffer.from(candidateDigest, "hex");
  const stored = Buffer.from(storedDigest, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
};

export interface ApiTokenMaterial {
  token: string;
  prefix: string;
  digest: string;
}

export const createApiTokenMaterial = (): ApiTokenMaterial => {
  const prefix = randomBytes(8).toString("hex");
  const token = `wk_${prefix}_${randomBytes(32).toString("base64url")}`;
  return { token, prefix, digest: digestApiToken(token) };
};
