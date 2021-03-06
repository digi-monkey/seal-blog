import NaiveFriends721ContractArtifact from "../configs/blockchain/contract-artifact/NaiveFriends721.json";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { Contract, EventData } from "web3-eth-contract";
import { HexStr } from "@seal-blog/sdk";
import { ethers } from "ethers";

export const NAIVE_FRIENDS_CONTRACT_ARTIFACT = NaiveFriends721ContractArtifact;

export const web3 = new Web3(Web3.givenProvider);
export const contractFactory = new web3.eth.Contract(
  NAIVE_FRIENDS_CONTRACT_ARTIFACT.abi as AbiItem[]
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

// event
export interface DecodedEventLog {
  [key: string]: any;
}
export interface DecEventData extends EventData {
  decoded: DecodedEventLog;
}

export type Topic = HexStr[] | HexStr | null;

export async function getContractEventLogs(
  contractAddress: HexStr,
  abi: any,
  eventName: string,
  filterTopics: Topic[] = [],
  fromBlock: string = "earliest",
  toBlock: string = "latest"
) {
  const contractInterface = new ethers.utils.Interface(abi);
  const fragment = contractInterface.getEvent(eventName);
  const topics = contractInterface.encodeFilterTopics(fragment, filterTopics);
  const contract = new web3.eth.Contract(abi as AbiItem[], contractAddress);
  const events: EventData[] = await contract.getPastEvents(eventName, {
    topics,
    fromBlock,
    toBlock,
  });
  return events.map((e) => {
    const data = e.raw.data;
    const topics = e.raw.topics;
    const decoded = contractInterface.decodeEventLog(fragment, data, topics);
    const r: DecEventData = {
      ...e,
      decoded,
    };
    return r;
  });
}
