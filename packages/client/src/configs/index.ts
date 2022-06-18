import { envConfig } from "./env-config";
import config from "./constant.json";
import { HexNum } from "@seal-blog/sdk";
import CONFIG from "./blockchain/networks.json";
import TOKEN_PRICE_IDS from "./blockchain/coingecko.json";

export const API_SERVER_URL =
  envConfig.mode === "development"
    ? config.server_url.development
    : config.server_url.production;

export const CLIENT_URL =
  envConfig.mode === "development"
    ? config.client_url.development
    : config.client_url.production;

export interface ChainNetwork {
  chainId: HexNum;
  rpc: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string | null;
  depositEntry: string | null;
  helpEntry: string | null;
}

export interface ChainNetworkConfigs {
  [chainId: HexNum]: ChainNetwork;
}

export const getChainNetwork = (chainId: HexNum) => {
  const networks = CONFIG.networks as ChainNetworkConfigs;

  if (!(chainId in networks)) {
    throw new Error(`unsupported network! chainId: ${chainId}`);
  }

  return networks[chainId];
};

export const CHAIN_NETWORKS = filterNetworks(
  CONFIG.networks as ChainNetworkConfigs
);

export interface TokenPriceIds {
  [tokenSymbol: string]: string;
}

export const TOKEN_IDS = TOKEN_PRICE_IDS as TokenPriceIds;

export function getTokenPriceIdBySymbol(symbol: string) {
  return TOKEN_IDS[symbol];
}

export function filterNetworks(networks: ChainNetworkConfigs) {
  const value = Object.keys(networks)
    .filter((chainId) => !envConfig.omitNetworks.includes(chainId))
    .reduce((obj, chainId) => {
      return Object.assign(obj, {
        [chainId]: networks[chainId],
      });
    }, {});
  return value as ChainNetworkConfigs;
}
