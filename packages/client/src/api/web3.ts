import ContractArtifact from "../configs/blockchain/contract-artifact.json";
import CONFIG from "../configs/blockchain/config.json";
import { envConfig } from "../configs/env-config";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { Contract } from "web3-eth-contract";

export const getConfigBlockchainNetwork = () => {
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

export const configChain = getConfigBlockchainNetwork();
export const configChainRpcUrl = configChain.rpc;
export const configChainId = configChain.chainId;

export const CONTRACT_ARTIFACT = ContractArtifact;

export const web3 = new Web3(Web3.givenProvider || configChainRpcUrl);
export const contractFactory = new web3.eth.Contract(
  CONTRACT_ARTIFACT.abi as AbiItem[]
);

export const ZERO_ADDRESS = "0x" + "0".repeat(40);

export const getFirstTokenId = async (
  contractFactory: Contract,
  address: string
) => {
  const ownedNftCount = await contractFactory.methods.balanceOf(address).call();
  if (ownedNftCount === "0") {
    console.log("not NFT holder, no avatar.");
    return null;
  }
  const events = await contractFactory.getPastEvents("Transfer", {
    fromBlock: "earliest",
    toBlock: "latest",
  });
  const relatedEvents = events.filter(
    (e) =>
      e.returnValues.from.toLowerCase() === ZERO_ADDRESS.toLowerCase() &&
      e.returnValues.to.toLowerCase() === address.toLowerCase()
  );
  console.log("relatedEvents: ", relatedEvents);
  if (relatedEvents.length === 0) {
    console.log("can not find relatedEvents");
    return null;
  }
  const tokenIds: string[] = relatedEvents.map((e) => e.returnValues.tokenId);
  return tokenIds[0];
};
