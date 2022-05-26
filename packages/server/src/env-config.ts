import { BlockchainNetwork } from "@seal-blog/sdk";
import CONFIG from "./contracts/config.json";
import { env } from "process";
require("dotenv").config();

export const envConfig = {
  networkType: getRequired("BLOCKCHAIN_NETWORK"),
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

export const getBlockchainNetwork = () => {
  const networkType = envConfig.networkType;
  switch (networkType) {
    case "devnet":
      return BlockchainNetwork.devnet;
    case "testnet":
      return BlockchainNetwork.testnet;
    case "mainnet":
      return BlockchainNetwork.mainnet;
    default:
      return BlockchainNetwork.devnet;
  }
};

export const getBlockchainNetworkUrl = () => {
  const networkType = envConfig.networkType;
  switch (networkType) {
    case "devnet":
      return CONFIG.polyjuice.devnet;
    case "testnet":
      return CONFIG.polyjuice.testnet;
    case "mainnet":
      return CONFIG.polyjuice.mainnet;
    default:
      return CONFIG.polyjuice.devnet;
  }
};

export const networkUrl = getBlockchainNetworkUrl();
