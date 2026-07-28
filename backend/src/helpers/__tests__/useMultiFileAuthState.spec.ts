jest.mock("@whiskeysockets/baileys", () => {
  const reviver = (_key: string, value: any) =>
    value?.type === "Buffer" && Array.isArray(value.data)
      ? Buffer.from(value.data)
      : value;
  return {
    BufferJSON: {
      replacer: (_key: string, value: any) => value,
      reviver
    },
    initAuthCreds: () => ({
      noiseKey: { private: Buffer.from("initial"), public: Buffer.from("public") }
    }),
    proto: {
      Message: {
        AppStateSyncKeyData: { fromObject: (value: any) => value }
      }
    }
  };
});

jest.mock("../../libs/cache", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delFromPattern: jest.fn()
  }
}));

import { BufferJSON } from "@whiskeysockets/baileys";
import {
  authKeyPrefix,
  BaileysAuthCorruptError,
  createBaileysAuthState
} from "../useMultiFileAuthState";

class MemoryStore {
  values = new Map<string, string>();
  failRead = false;
  failWrite = false;

  async get(key: string): Promise<string | null> {
    if (this.failRead) throw new Error("REDIS_UNAVAILABLE");
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<string> {
    if (this.failWrite) throw new Error("REDIS_UNAVAILABLE");
    this.values.set(key, value);
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.values.delete(key) ? 1 : 0;
  }
}

const whatsapp = { id: 9, companyId: 3 } as any;

describe("Baileys auth state v2", () => {
  it("isolates the keyspace by company and WhatsApp connection", () => {
    expect(authKeyPrefix(whatsapp)).toBe("baileys:v2:{3:9}");
    expect(authKeyPrefix({ id: 9, companyId: 4 } as any)).not.toBe(
      authKeyPrefix(whatsapp)
    );
  });

  it("persists and restores Buffer-based credentials", async () => {
    const store = new MemoryStore();
    const first = await createBaileysAuthState(whatsapp, store);
    first.state.creds.noiseKey.private = Buffer.from("private-key");
    await first.saveCreds();

    const restored = await createBaileysAuthState(whatsapp, store);
    expect(Buffer.from(restored.state.creds.noiseKey.private).toString()).toBe(
      "private-key"
    );
  });

  it("migrates a valid legacy credential without deleting rollback data", async () => {
    const store = new MemoryStore();
    const first = await createBaileysAuthState(whatsapp, store);
    const legacy = JSON.stringify(first.state.creds, BufferJSON.replacer);
    store.values.clear();
    store.values.set("sessions:9:creds", legacy);

    await createBaileysAuthState(whatsapp, store);

    expect(store.values.has("sessions:9:creds")).toBe(true);
    expect(store.values.has("baileys:v2:{3:9}:creds")).toBe(true);
  });

  it("fails closed when Redis is unavailable", async () => {
    const store = new MemoryStore();
    store.failRead = true;

    await expect(createBaileysAuthState(whatsapp, store)).rejects.toThrow(
      "REDIS_UNAVAILABLE"
    );
  });

  it("does not replace corrupted v2 credentials with a new identity", async () => {
    const store = new MemoryStore();
    store.values.set("baileys:v2:{3:9}:creds", "{\"schemaVersion\":2}");

    await expect(createBaileysAuthState(whatsapp, store)).rejects.toBeInstanceOf(
      BaileysAuthCorruptError
    );
  });

  it("propagates credential write failures", async () => {
    const store = new MemoryStore();
    const auth = await createBaileysAuthState(whatsapp, store);
    store.failWrite = true;

    await expect(auth.saveCreds()).rejects.toThrow("REDIS_UNAVAILABLE");
  });
});
