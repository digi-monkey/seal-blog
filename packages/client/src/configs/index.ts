import { envConfig } from "./env-config";
import config from "./constant.json";

export const API_SERVER_URL =
  envConfig.mode === "development"
    ? config.server_url.development
    : config.server_url.production;

export const CLIENT_URL =
  envConfig.mode === "development"
    ? config.client_url.development
    : config.client_url.production;
