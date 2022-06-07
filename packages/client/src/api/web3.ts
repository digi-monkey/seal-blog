import ContractArtifact from "../configs/blockchain/contract-artifact.json";
import CONFIG from "../configs/blockchain/config.json";
import { envConfig } from "../configs/env-config";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { Contract } from "web3-eth-contract";
import { HexStr } from "@seal-blog/sdk";

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
console.log(envConfig.networkType, configChain);
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

export const subscribe = async (
  contractFactory: Contract,
  account: HexStr,
  pk: string
) => {
  const tokenPrice = await contractFactory.methods.tokenPrice().call();
  const tx = await contractFactory.methods
    .subscribe(account, pk)
    .send({ from: account, value: tokenPrice });
  console.log(tx);
  return tx;
};

export const mint = async (contractFactory: Contract, account: HexStr) => {
  const tokenPrice = await contractFactory.methods.tokenPrice().call();
  console.log(tokenPrice);
  const tx = await contractFactory.methods
    .mint(account)
    .send({ from: account, value: tokenPrice });
  console.log(tx);
  return tx;
};

export const setPk = async (
  contractFactory: Contract,
  account: HexStr,
  pk: string
) => {
  const tokenId = await getFirstTokenId(contractFactory, account);
  const tx = await contractFactory.methods
    .setEncryptPublicKey(tokenId, pk)
    .send({ from: account });
  console.log(tx);
};

export const isSubscriber = async (
  contractFactory: Contract,
  account: HexStr
) => {
  const tokenId = await getFirstTokenId(contractFactory, account);
  if (tokenId == null) return false;

  const pk = await contractFactory.methods.encryptPublicKeys(tokenId).call();
  if (pk == null) return false;

  return true;
};
