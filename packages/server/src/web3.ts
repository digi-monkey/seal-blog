import { ethers } from "ethers";
import { networkUrl } from "./env-config";
import CONTRACT_ARTIFACTS from "./contracts/contract-artifact.json";

export const provider = new ethers.providers.JsonRpcProvider(networkUrl);

export const Contract = new ethers.ContractFactory(
  CONTRACT_ARTIFACTS.abi,
  CONTRACT_ARTIFACTS.bytecode
);
export const ZERO_ADDRESS = "0x" + "0".repeat(40);
