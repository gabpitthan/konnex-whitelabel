import axios, { AxiosRequestConfig, AxiosInstance } from "axios";
import {
  assertPublicHttpUrl,
  restrictedHttpAgent,
  restrictedHttpsAgent
} from "./ssrfProtection";
import logger from "../utils/logger";

const MEBIBYTE = 1024 * 1024;

export const HTTP_CLIENT_REDACT_KEYS = Object.freeze([
  "authorization",
  "proxy-authorization",
  "access_token",
  "client_secret",
  "fb_exchange_token",
  "apiKey",
  "password"
]);

interface HttpClientLimits {
  timeout: number;
  maxContentLength: number;
  maxBodyLength: number;
}

export const HTTP_CLIENT_LIMITS = Object.freeze({
  json: Object.freeze({
    timeout: 15_000,
    maxContentLength: 5 * MEBIBYTE,
    maxBodyLength: 5 * MEBIBYTE
  }),
  media: Object.freeze({
    timeout: 30_000,
    maxContentLength: 25 * MEBIBYTE,
    maxBodyLength: 5 * MEBIBYTE
  }),
  upload: Object.freeze({
    timeout: 60_000,
    maxContentLength: 5 * MEBIBYTE,
    maxBodyLength: 32 * MEBIBYTE
  }),
  maxRedirects: 3
});

const createClient = (
  limits: HttpClientLimits,
  config: AxiosRequestConfig = {}
): AxiosInstance =>
  axios.create({
    ...config,
    timeout: limits.timeout,
    maxContentLength: limits.maxContentLength,
    maxBodyLength: limits.maxBodyLength,
    maxRedirects: config.maxRedirects ?? HTTP_CLIENT_LIMITS.maxRedirects,
    redact: [...HTTP_CLIENT_REDACT_KEYS]
  });

const protectUntrustedClient = (client: AxiosInstance): AxiosInstance => {
  client.interceptors.request.use(config => {
    assertPublicHttpUrl(config.url || "", config.baseURL);
    return config;
  });
  client.interceptors.response.use(undefined, error => {
    logger.warn(
      {
        event: "external_http_request_failed",
        code: typeof error?.code === "string" ? error.code : "UNKNOWN",
        status:
          typeof error?.response?.status === "number"
            ? error.response.status
            : undefined,
        securityBlocked: error?.code === "ERR_SSRF_BLOCKED"
      },
      "External HTTP request failed"
    );
    return Promise.reject(error);
  });
  return client;
};

export const externalJsonClient = createClient(HTTP_CLIENT_LIMITS.json);
export const externalMediaClient = createClient(HTTP_CLIENT_LIMITS.media);
export const externalUploadClient = createClient(HTTP_CLIENT_LIMITS.upload);

export const externalRestrictedJsonClient = protectUntrustedClient(
  createClient(HTTP_CLIENT_LIMITS.json, {
    proxy: false,
    maxRedirects: 0,
    socketPath: undefined,
    allowedSocketPaths: [],
    httpAgent: restrictedHttpAgent,
    httpsAgent: restrictedHttpsAgent
  })
);

export const externalRestrictedMediaClient = protectUntrustedClient(
  createClient(HTTP_CLIENT_LIMITS.media, {
    proxy: false,
    maxRedirects: 0,
    socketPath: undefined,
    allowedSocketPaths: [],
    httpAgent: restrictedHttpAgent,
    httpsAgent: restrictedHttpsAgent
  })
);

export const createExternalJsonClient = (
  config: AxiosRequestConfig
): AxiosInstance => createClient(HTTP_CLIENT_LIMITS.json, config);

export const createExternalUploadClient = (
  config: AxiosRequestConfig
): AxiosInstance => createClient(HTTP_CLIENT_LIMITS.upload, config);
