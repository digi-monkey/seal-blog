import hre, { ethers } from "hardhat";
import NaiveFriends721 from "../artifacts/contracts/NaiveFriends721.sol/NaiveFriends721.json";
import path from "path";
import { createDirIfNotExist, decimalHelper, writeJsonFile } from "./utils";
import { HttpNetworkConfig } from "hardhat/types";

const HISTORY_ROOT_DIR = path.resolve(__dirname, "../history");
const DEPLOY_HISTORY_FILE = path.resolve(HISTORY_ROOT_DIR, "./deploy.json");

const tokenPriceInCKB = "100"; // 100 ckb;
const tokenPriceInEth = "0.1"; // 0.1 eth;

export interface DeployContractResult {
  transactionHash: string;
  deployerAddress: string;
  contractAddress: string;
  networkUrl: string;
  createdTime?: number;
}

export interface DeployedItem {
  [contractName: string]: DeployContractResult;
}

async function recordDeployHistory(
  name: string,
  txHash: string,
  deployer: string,
  address: string,
  network: string
) {
  createDirIfNotExist(HISTORY_ROOT_DIR);
  const deployResult: DeployContractResult = {
    transactionHash: txHash,
    deployerAddress: deployer,
    contractAddress: address,
    networkUrl: network,
    createdTime: new Date().getTime(),
  };
  const deployedItem: DeployedItem = {};
  deployedItem[name] = deployResult;

  await writeJsonFile(deployedItem, DEPLOY_HISTORY_FILE);
  console.debug(`record deploy history into file ${DEPLOY_HISTORY_FILE}`);
}

async function main() {
  const networkName = hre.network.name;
  const networkUrl = (hre.config.networks[networkName] as HttpNetworkConfig)
    .url;

  const tokenPrice = networkName.startsWith("polyjuice")
    ? decimalHelper.ethToCkb(
        ethers.utils.parseEther(tokenPriceInCKB).toString()
      ) // 100 ckb
    : ethers.utils.parseEther(tokenPriceInEth); // 0.1 eth

  const adminAddress = (await ethers.getSigners())[0].address;
  const contract = await ethers.getContractFactory("NaiveFriends721");
  const myContract = await contract.deploy(tokenPrice, adminAddress);

  await myContract.deployed();

  console.log(
    `deployed ${NaiveFriends721.contractName}: ${myContract.address}`
  );

  // record deploy history
  await recordDeployHistory(
    NaiveFriends721.contractName,
    myContract.deployTransaction.hash,
    adminAddress,
    myContract.address,
    networkUrl
  );
  return myContract.address;
}

// run main
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
