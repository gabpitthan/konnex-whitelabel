import {
  createExternalJsonClient,
  externalJsonClient,
  externalMediaClient,
  externalUploadClient,
  HTTP_CLIENT_REDACT_KEYS,
  HTTP_CLIENT_LIMITS
} from "../httpClients";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, resolve } from "path";
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const sourceRoot = resolve(__dirname, "../..");

const listTypeScriptFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap(entry => {
    const absolutePath = join(directory, entry);
    if (statSync(absolutePath).isDirectory()) {
      return listTypeScriptFiles(absolutePath);
    }
    return absolutePath.endsWith(".ts") ? [absolutePath] : [];
  });

describe("bounded external HTTP clients", () => {
  it.each([
    [externalJsonClient, HTTP_CLIENT_LIMITS.json],
    [externalMediaClient, HTTP_CLIENT_LIMITS.media],
    [externalUploadClient, HTTP_CLIENT_LIMITS.upload]
  ])("enforces timeout, redirect, response and body budgets", (client, limits) => {
    expect(client.defaults.timeout).toBe(limits.timeout);
    expect(client.defaults.maxContentLength).toBe(limits.maxContentLength);
    expect(client.defaults.maxBodyLength).toBe(limits.maxBodyLength);
    expect(client.defaults.maxRedirects).toBe(HTTP_CLIENT_LIMITS.maxRedirects);
    expect(client.defaults.redact).toEqual(HTTP_CLIENT_REDACT_KEYS);
  });

  it("preserves safe budgets when creating a service-specific client", () => {
    const client = createExternalJsonClient({
      baseURL: "https://graph.facebook.com/v18.0/",
      params: { access_token: "test-only" }
    });

    expect(client.defaults.baseURL).toBe("https://graph.facebook.com/v18.0/");
    expect(client.defaults.timeout).toBe(HTTP_CLIENT_LIMITS.json.timeout);
    expect(client.defaults.maxContentLength).toBe(
      HTTP_CLIENT_LIMITS.json.maxContentLength
    );
  });

  it("keeps direct Axios construction centralized and forbids infinite budgets", () => {
    const violations = listTypeScriptFiles(sourceRoot)
      .filter(file => !file.includes("/__tests__/"))
      .flatMap(file => {
        const source = readFileSync(file, "utf8");
        const usesAxiosDirectly =
          /from ["']axios["']|require\(["']axios["']\)/.test(source);
        const hasInfiniteBudget = /max(?:Body|Content)Length:\s*Infinity/.test(
          source
        );

        return usesAxiosDirectly || hasInfiniteBudget
          ? [relative(sourceRoot, file)]
          : [];
      });

    expect(violations).toEqual(["libs/httpClients.ts"]);
  });

  it("redacts nested credentials when an Axios error is serialized", () => {
    const config = {
      ...externalJsonClient.defaults,
      headers: new AxiosHeaders({
        Authorization: "Bearer test-secret"
      }),
      params: {
        access_token: "test-secret"
      }
    } as InternalAxiosRequestConfig;
    const error = new AxiosError("provider failure", "ERR_TEST", config);
    const serialized = error.toJSON() as {
      config: { headers: { Authorization: string }; params: { access_token: string } };
    };

    expect(serialized.config.headers.Authorization).not.toContain("test-secret");
    expect(serialized.config.params.access_token).not.toContain("test-secret");
  });
});
