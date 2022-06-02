import { ethers } from "ethers";
import { configNetworkUrl } from "./configs/env-config";
import CONTRACT_ARTIFACTS from "./configs/blockchain/contract-artifact.json";

export const provider = new ethers.providers.JsonRpcProvider(configNetworkUrl);

export const Contract = new ethers.ContractFactory(
  CONTRACT_ARTIFACTS.abi,
  CONTRACT_ARTIFACTS.bytecode
);
export const ZERO_ADDRESS = "0x" + "0".repeat(40);
