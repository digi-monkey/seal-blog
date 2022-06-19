import { Card } from "@material-ui/core";
import React, { useContext, useState } from "react";
import { Context } from "../../hooks/useContext";
import { Account } from "../metamask/account";
import { Network } from "../metamask/network";
import { PopupSelectChainId } from "../setting/setting";
import { Button, Text } from "degen";
import { web3 } from "../../api";
import CONTRACT_ARTIFACT from "../../configs/blockchain/msg-contract-artifact.json";
import { AbiItem } from "web3-utils";

const styles = {
  root: {
    height: "500px",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
  },
};

export function Messager() {
  const chainId = useContext(Context).network.selectChainId;
  const contractFactory = new web3.eth.Contract(
    CONTRACT_ARTIFACT.abi as AbiItem[]
  );

  const [account, setAccount] = useState<string>();
  const [_encryptPk, setEncryptPk] = useState<string>();
  const [isDeployed, setIsDeployed] = useState(true);
  const [deployedContractAddr, setDeployedContractAddr] = useState<string>(
    "0xacfF8190A3Ed40960671c7572a5287944C20E574"
  );
  const [msg, setMsg] = useState<string>();

  if (chainId == null) {
    alert("no chain id!");
  }

  const deploy = async () => {
    await contractFactory
      .deploy({
        data: CONTRACT_ARTIFACT.bytecode,
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
        setIsDeployed(true);
        const address = receipt.contractAddress;
        setDeployedContractAddr(address!);
        const txHash = receipt.transactionHash;
        console.log(txHash);
      });
  };

  const createChannel = async () => {
    contractFactory.options.address = deployedContractAddr;
    const nft = "0xd6D44f202dc5937e2B70cf218eba5F1Cb59A787F";
    const user2 = "0x768249aC5ED64517C96c16e26B7A5Aa3E9334217";
    const tx = await contractFactory.methods
      .createChannel(nft, nft, account, user2, 1, 2)
      .send({ from: account });
    console.log(tx);
  };

  const sendMessage = async () => {
    contractFactory.options.address = deployedContractAddr;
    //const nft ="0xd6D44f202dc5937e2B70cf218eba5F1Cb59A787F";
    //const user2="0x768249aC5ED64517C96c16e26B7A5Aa3E9334217"
    const msg = window.prompt("input your msg: ", "hello friend");
    if (msg == null) {
      return alert("msg is null");
    }
    const tx = await contractFactory.methods
      .sendMsg(1, 1, msg)
      .send({ from: account });
    console.log(tx);
  };

  const readMessage = async () => {
    contractFactory.options.address = deployedContractAddr;
    //const nft ="0xd6D44f202dc5937e2B70cf218eba5F1Cb59A787F";
    //const user2="0x768249aC5ED64517C96c16e26B7A5Aa3E9334217"
    const msg = await contractFactory.methods.readMsg(1, 2).call();
    console.log(msg);
    setMsg(msg);
  };

  return (
    <div style={styles.root}>
      <PopupSelectChainId />
      <Account
        accountCallback={setAccount}
        encryptionPublicKeyCallback={setEncryptPk}
      />
      <hr />
      <Network></Network>
      <hr />
      <Card>
        <Text transform="capitalize">experiment feature: e2e im</Text>
        <Button onClick={deploy}>deploy</Button>
        {isDeployed && (
          <Text transform="capitalize">address: {deployedContractAddr}</Text>
        )}
        <Button onClick={createChannel}>create channel</Button>
        <Button onClick={sendMessage}>send msg</Button>
        <Button onClick={readMessage}>read msg</Button>
        {msg && <Text>{msg}</Text>}
      </Card>
    </div>
  );
}
