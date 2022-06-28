import React, { useContext, useState } from "react";
import { Context } from "../../../hooks/useContext";
import { Card } from "@material-ui/core";
import { Button, Text } from "degen";
import { Account } from "../../metamask/account";
import { Network } from "../../metamask/network";
import { PopupSelectChainId } from "../../setting/setting";
import { web3 } from "../../../api";
import CHANEL_ARTIFACT from "../../../configs/blockchain/contract-artifact/NaiveChannel.json";
import MAIL_SERVER_ARTIFACT from "../../../configs/blockchain/contract-artifact/NaiveMail.json";
import ROOT_SERVER_ARTIFACT from "../../../configs/blockchain/contract-artifact/NaiveRootServer.json";
import { AbiItem } from "web3-utils";

const styles = {
  root: {
    height: "500px",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
};

export function DeployContracts() {
  const chainId = useContext(Context).network.selectChainId;

  const [account, setAccount] = useState<string>();
  const [isChannelDeployed, setIsChannelDeployed] = useState(true);
  const [channelAddr, setChannelAddr] = useState<string>(
    "0x7DA79EccF920e7Bb895759f36158656723eaBBe9"
  );
  const [isMailTokenDeployed, setIsMailTokenDeployed] = useState(true);
  const [mailServerAddr, setMailServerAddr] = useState<string>(
    "0xbd1183c2fb7a70bdb0348208cd6f0e6c226d3f19"
  );
  const [isRootServerDeployed, setIsRootServerDeployed] = useState(true);
  const [rootServerAddr, setRootServerAddr] = useState<string>(
    "0x63D14F63C9Cac557225633D45899584edcB9639f"
  );
  if (chainId == null) {
    alert("no chain id!");
  }

  const deployRootServer = async () => {
    const contractFactory = new web3.eth.Contract(
      ROOT_SERVER_ARTIFACT.abi as AbiItem[]
    );
    await contractFactory
      .deploy({
        data: ROOT_SERVER_ARTIFACT.bytecode,
        arguments: [],
      })
      .send({
        from: account!,
      })
      .on("transactionHash", function (txHash) {
        console.log("txHash:", txHash);
      })
      .on("error", function (err) {
        console.log(err.message);
      })
      .on("receipt", async function (receipt) {
        setIsRootServerDeployed(true);
        const address = receipt.contractAddress;
        setRootServerAddr(address!);
        const txHash = receipt.transactionHash;
        console.log(txHash);
      });
  };

  const setServerName = async () => {
    const contractFactory = new web3.eth.Contract(
      ROOT_SERVER_ARTIFACT.abi as AbiItem[]
    );
    contractFactory.options.address = rootServerAddr;

    const serverName = window.prompt(
      "input your mail server name(the @ thing): ",
      "myEmail"
    );
    if (serverName == null) {
      return alert("serverName is null");
    }
    const tx = await contractFactory.methods
      .setServerName(mailServerAddr, serverName)
      .send({ from: account });
    console.log(tx);
  };

  const deployMailToken = async () => {
    const contractFactory = new web3.eth.Contract(
      MAIL_SERVER_ARTIFACT.abi as AbiItem[]
    );
    await contractFactory
      .deploy({
        data: MAIL_SERVER_ARTIFACT.bytecode,
        arguments: [0, "0x" + "00".repeat(20), "", 0, 0],
      })
      .send({
        from: account!,
      })
      .on("transactionHash", function (txHash) {
        console.log("txHash:", txHash);
      })
      .on("error", function (err) {
        console.log(err.message);
      })
      .on("receipt", async function (receipt) {
        setIsMailTokenDeployed(true);
        const address = receipt.contractAddress;
        setMailServerAddr(address!);
        const txHash = receipt.transactionHash;
        console.log(txHash);
      });
  };

  const deployChannel = async () => {
    const channelContractFactory = new web3.eth.Contract(
      CHANEL_ARTIFACT.abi as AbiItem[]
    );
    await channelContractFactory
      .deploy({
        data: CHANEL_ARTIFACT.bytecode,
        arguments: [],
      })
      .send({
        from: account!,
      })
      .on("transactionHash", function (txHash) {
        console.log("txHash:", txHash);
      })
      .on("error", function (err) {
        console.log(err.message);
      })
      .on("receipt", async function (receipt) {
        setIsChannelDeployed(true);
        const address = receipt.contractAddress;
        setChannelAddr(address!);
        const txHash = receipt.transactionHash;
        console.log(txHash);
      });
  };

  return (
    <div style={styles.root}>
      <PopupSelectChainId />
      <Account accountCallback={setAccount} />
      <hr />
      <span className="block fixed">
        <Network></Network>
      </span>
      <hr />
      <Card>
        <Text transform="capitalize">experiment feature: e2e im</Text>
        <Button onClick={deployChannel}>deploy channel</Button>
        {isChannelDeployed && (
          <Text transform="capitalize">address: {channelAddr}</Text>
        )}
        <Button onClick={deployMailToken}>deploy mail token</Button>
        mail token:{" "}
        {isMailTokenDeployed && (
          <div>
            <Text transform="capitalize">
              <a
                target={"_blank"}
                href={
                  "/subscribe?chain_id=" +
                  chainId +
                  "&contract=" +
                  mailServerAddr
                }
              >
                {mailServerAddr}
              </a>
            </Text>
          </div>
        )}
        <Button onClick={deployRootServer}>deploy root server</Button>
        root server:{" "}
        {isRootServerDeployed && (
          <Text transform="capitalize">
            <a
              target={"_blank"}
              href={
                "/subscribe?chain_id=" + chainId + "&contract=" + rootServerAddr
              }
            >
              {rootServerAddr}
            </a>
          </Text>
        )}
        <hr />
        <Button onClick={setServerName}>set server name for mail token</Button>
        <hr />
      </Card>
    </div>
  );
}
