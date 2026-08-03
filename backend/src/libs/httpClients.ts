import axios, { AxiosRequestConfig, AxiosInstance } from "axios";

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
    maxRedirects: HTTP_CLIENT_LIMITS.maxRedirects,
    redact: [...HTTP_CLIENT_REDACT_KEYS]
  });

export const externalJsonClient = createClient(HTTP_CLIENT_LIMITS.json);
export const externalMediaClient = createClient(HTTP_CLIENT_LIMITS.media);
export const externalUploadClient = createClient(HTTP_CLIENT_LIMITS.upload);

export const createExternalJsonClient = (
  config: AxiosRequestConfig
): AxiosInstance => createClient(HTTP_CLIENT_LIMITS.json, config);

export const createExternalUploadClient = (
  config: AxiosRequestConfig
): AxiosInstance => createClient(HTTP_CLIENT_LIMITS.upload, config);
