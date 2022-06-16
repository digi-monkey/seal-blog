import { ethers } from "ethers";
import { getChainNetwork } from "./configs/env-config";
import CONTRACT_ARTIFACTS from "./configs/blockchain/contract-artifact.json";
import { HexNum, HexStr, parsePostId } from "@seal-blog/sdk";

export const getProvider = (chainId: HexNum) => {
  const network = getChainNetwork(chainId);
  return new ethers.providers.JsonRpcProvider(network.rpc);
};

export const getAccessTokenContract = (postId: HexStr) => {
  const result = parsePostId(postId);
  const contractAddress = result.contractAddress;
  const chainId = result.chainId;
  const provider = getProvider(chainId);
  const accessToken = new ethers.Contract(
    contractAddress,
    CONTRACT_ARTIFACTS.abi,
    provider
  );
  return accessToken;
};

export const Contract = new ethers.ContractFactory(
  CONTRACT_ARTIFACTS.abi,
  CONTRACT_ARTIFACTS.bytecode
);

export const ZERO_ADDRESS = "0x" + "0".repeat(40);
