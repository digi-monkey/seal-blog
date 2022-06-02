import React, { useEffect, useState } from "react";
import { Card } from "@material-ui/core";
import { Text } from "degen";
import {
  contractFactory,
  CONTRACT_ARTIFACT,
  web3,
  ZERO_ADDRESS,
} from "../../api/web3";
import web3Utils from "web3-utils";
import { styles } from "../style/styles";
import { Api } from "@seal-blog/sdk";
import { API_SERVER_URL } from "../../configs";

const api = new Api(API_SERVER_URL);

export interface NftManagerProp {
  account: string | undefined;
}

export function Token(props: NftManagerProp) {
  const { account } = props;
  const [totalReaders, setTotalReaders] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [balance, setBalance] = useState(0);
  const [admin, setAdmin] = useState("");
  const [isDeployed, setIsDeployed] = useState(false);
  const [deployedContractAddr, setDeployedContractAddr] = useState<string>();

  useEffect(() => {
    fetchContractAddress();
  }, [account]);

  useEffect(() => {
    if (!deployedContractAddr) {
      return;
    }

    contractFactory.options.address = deployedContractAddr!;

    fetchTotalReaders();
    fetchTokenPrice();
    fetchContractBalance();
    fetchAdminAddress();
  }, [deployedContractAddr]);

  const fetchTotalReaders = async () => {
    const totalReaders = (
      await contractFactory.getPastEvents("Transfer")
    ).filter(
      (e) => e.returnValues.from.toLowerCase() === ZERO_ADDRESS.toLowerCase()
    );
    setTotalReaders(totalReaders.length);
    //setTotalReaders(0);
  };

  const fetchTokenPrice = async () => {
    const tokenPrice = await contractFactory.methods.tokenPrice().call();
    setTokenPrice(tokenPrice);
  };

  const fetchContractBalance = async () => {
    const bal = await web3.eth.getBalance(deployedContractAddr!);
    setBalance(+bal);
  };

  const fetchAdminAddress = async () => {
    const adminAddr = await contractFactory.methods.admin().call();
    setAdmin(adminAddr);
  };

  const fetchContractAddress = async () => {
    if (!account) return;

    try {
      const addr = await api.getContractAddress(account);
      setDeployedContractAddr(addr);
      setIsDeployed(true);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const deploy = async () => {
    if (isDeployed) {
      const isConfirm = window.confirm(
        "you already has an nft contract, deployed a new one?"
      );
      if (!isConfirm) return;
    }

    const tokenPrice = web3Utils.toWei("0.2", "ether");
    const tokenAdminAddr = account;
    await contractFactory
      .deploy({
        data: CONTRACT_ARTIFACT.bytecode,
        arguments: [tokenPrice, tokenAdminAddr],
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
        setDeployedContractAddr(address);
        const txHash = receipt.transactionHash;
        const res = await api.bindContract(txHash);
        console.log("bind contract:", res);
      });
  };

  return (
    <div>
      <Card style={{ padding: "10px", margin: "20px 0", borderRadius: "5px" }}>
        <h1>Your Readership NFT</h1>
        {isDeployed && (
          <div>
            <Text>
              Contract Address: <a href="">{deployedContractAddr}</a>
            </Text>

            <Text>Total Readers: {totalReaders}</Text>

            <Text>
              {"Token Price: " + tokenPrice}
              --
              <a
                href=""
                onClick={() => {
                  alert("change toke price");
                }}
              >
                Change Token Price
              </a>
            </Text>

            <Text>
              {"Eth Balance: " + balance}
              --
              <a
                href=""
                onClick={() => {
                  alert("Withdraw All");
                }}
              >
                Withdraw All
              </a>
            </Text>

            <Text>
              {"Admin Address: " + admin}
              --
              <a
                href=""
                onClick={() => {
                  alert("Withdraw All");
                }}
              >
                Transfer Admin
              </a>
            </Text>
          </div>
        )}
        <hr />
        {
          <div>
            <Text>No Contract/Not Your Contract?</Text>
            <Text variant="large">
              <a style={styles.link} onClick={deploy}>
                Create New One
              </a>
            </Text>
            <Text>
              <a href="/nft/info">learn more</a>
            </Text>
          </div>
        }
      </Card>
    </div>
  );
}
