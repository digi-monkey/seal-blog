import CONFIG from "./blockchain/networks.json";
import { env } from "process";
import { HexNum } from "@seal-blog/sdk";
require("dotenv").config();

export const envConfig = {
  port: getRequired("PORT"),
};

function getRequired(name: string): string {
  const value = env[name];
  if (value == null) {
    throw new Error(`no env ${name} provided`);
  }

  return value!;
}

function _getOptional(name: string): string | undefined {
  return env[name];
}

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
