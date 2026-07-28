import { createHash } from "crypto";
import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
  SignalDataTypeMap
} from "@whiskeysockets/baileys";

import cacheLayer from "../libs/cache";
import Whatsapp from "../models/Whatsapp";

const AUTH_SCHEMA_VERSION = 2;

interface AuthStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

interface AuthEnvelope {
  schemaVersion: number;
  companyId: number;
  whatsappId: number;
  checksum: string;
  payload: string;
}

export class BaileysAuthCorruptError extends Error {
  constructor(readonly key: string) {
    super("BAILEYS_AUTH_STATE_CORRUPT");
    this.name = "BaileysAuthCorruptError";
  }
}

const checksum = (payload: string): string =>
  createHash("sha256").update(payload).digest("hex");

export const authKeyPrefix = (whatsapp: Pick<Whatsapp, "id" | "companyId">): string =>
  `baileys:v2:{${whatsapp.companyId}:${whatsapp.id}}`;

const legacyKey = (whatsappId: number, file: string): string =>
  `sessions:${whatsappId}:${file}`;

const v2Key = (
  whatsapp: Pick<Whatsapp, "id" | "companyId">,
  file: string
): string => `${authKeyPrefix(whatsapp)}:${file}`;

const serializePayload = (data: unknown): string =>
  JSON.stringify(data, BufferJSON.replacer);

const parsePayload = (payload: string, key: string): any => {
  try {
    return JSON.parse(payload, BufferJSON.reviver);
  } catch {
    throw new BaileysAuthCorruptError(key);
  }
};

export const createBaileysAuthState = async (
  whatsapp: Whatsapp,
  store: AuthStore = cacheLayer
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  if (!Number.isInteger(whatsapp.id) || !Number.isInteger(whatsapp.companyId)) {
    throw new Error("BAILEYS_AUTH_INVALID_OWNER");
  }

  const writeData = async (data: unknown, file: string): Promise<void> => {
    const key = v2Key(whatsapp, file);
    const payload = serializePayload(data);
    const envelope: AuthEnvelope = {
      schemaVersion: AUTH_SCHEMA_VERSION,
      companyId: whatsapp.companyId,
      whatsappId: whatsapp.id,
      checksum: checksum(payload),
      payload
    };
    await store.set(key, JSON.stringify(envelope));
  };

  const readV2 = async (file: string): Promise<any | undefined> => {
    const key = v2Key(whatsapp, file);
    const raw = await store.get(key);
    if (raw === null) return undefined;

    let envelope: AuthEnvelope;
    try {
      envelope = JSON.parse(raw) as AuthEnvelope;
    } catch {
      throw new BaileysAuthCorruptError(key);
    }

    if (
      envelope.schemaVersion !== AUTH_SCHEMA_VERSION ||
      envelope.companyId !== whatsapp.companyId ||
      envelope.whatsappId !== whatsapp.id ||
      typeof envelope.payload !== "string" ||
      envelope.checksum !== checksum(envelope.payload)
    ) {
      throw new BaileysAuthCorruptError(key);
    }

    return parsePayload(envelope.payload, key);
  };

  const readData = async (file: string): Promise<any | undefined> => {
    const current = await readV2(file);
    if (current !== undefined) return current;

    const oldKey = legacyKey(whatsapp.id, file);
    const legacy = await store.get(oldKey);
    if (legacy === null) return undefined;

    const migrated = parsePayload(legacy, oldKey);
    await writeData(migrated, file);
    return migrated;
  };

  const removeData = async (file: string): Promise<void> => {
    await Promise.all([
      store.del(v2Key(whatsapp, file)),
      store.del(legacyKey(whatsapp.id, file))
    ]);
  };

  const storedCreds = await readData("creds");
  const creds: AuthenticationCreds = storedCreds || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async id => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async data => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}`;
              tasks.push(value ? writeData(value, file) : removeData(file));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData(creds, "creds")
  };
};

export const useMultiFileAuthState = (
  whatsapp: Whatsapp
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> =>
  createBaileysAuthState(whatsapp);

export const purgeBaileysAuthState = async (
  whatsapp: Pick<Whatsapp, "id" | "companyId">
): Promise<void> => {
  await Promise.all([
    cacheLayer.delFromPattern(`${authKeyPrefix(whatsapp)}:*`),
    cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`)
  ]);
};
