import React, { useEffect, useState } from "react";
import { Card } from "@material-ui/core";
import { Text } from "degen";
import { contractFactory, CONTRACT_ARTIFACT, web3 } from "../../api/web3";
import web3Utils from "web3-utils";
import { styles } from "../style/styles";
import { Api } from "@seal-blog/sdk";
import { API_SERVER_URL } from "../../configs";
import { avatar } from "../../api";

const api = new Api(API_SERVER_URL);

export interface NftManagerProp {
  account: string | undefined;
  encryptPk: string | undefined;
}

export function Token(props: NftManagerProp) {
  const { account, encryptPk } = props;
  const [totalReaders, setTotalReaders] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [balance, setBalance] = useState(0);
  const [admin, setAdmin] = useState("");
  const [nftUrl, setNftUrl] = useState<string>();
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
    fetchBaseUri();
  }, [deployedContractAddr]);

  const fetchTotalReaders = async () => {
    const totalReaders = await contractFactory.methods.totalTokens().call();
    setTotalReaders(totalReaders);
  };

  const fetchTokenPrice = async () => {
    const value = await contractFactory.methods.tokenPrice().call();
    const tokenPrice = web3Utils.fromWei(value);
    setTokenPrice(parseInt(tokenPrice));
  };

  const fetchContractBalance = async () => {
    const bal = await web3.eth.getBalance(deployedContractAddr!);
    const balance = web3Utils.fromWei(bal);
    setBalance(parseInt(balance));
  };

  const fetchAdminAddress = async () => {
    const adminAddr = await contractFactory.methods.admin().call();
    setAdmin(adminAddr);
  };

  const fetchBaseUri = async () => {
    const url = await contractFactory.methods.baseUri().call();
    setNftUrl(url);
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

    const tokenPrice = promptInputTokenPrice();
    if (tokenPrice == null) {
      return;
    }

    const tokenAdminAddr = account;
    const pk = encryptPk;
    await contractFactory
      .deploy({
        data: CONTRACT_ARTIFACT.bytecode,
        arguments: [tokenPrice, tokenAdminAddr, pk],
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

  const changeTokenPrice = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (deployedContractAddr == null) {
      return alert("contract address is null, have you deploy yet?");
    }

    const tokenPrice = promptInputTokenPrice();
    if (tokenPrice == null) {
      return;
    }

    contractFactory.options.address = deployedContractAddr;
    const tx = await contractFactory.methods.setPrice(tokenPrice).send({
      from: account,
    });
    console.log(tx);
    await fetchTokenPrice();
  };

  const withdrawBalance = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (deployedContractAddr == null) {
      return alert("contract address is null, have you deploy yet?");
    }

    const amount = promptInputWithdrawAmount();
    if (amount == null) {
      return;
    }

    contractFactory.options.address = deployedContractAddr;
    const tx = await contractFactory.methods.withdraw(amount).send({
      from: account,
    });
    console.log(tx);
    await fetchContractBalance();
  };

  const transferAdmin = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (deployedContractAddr == null) {
      return alert("contract address is null, have you deploy yet?");
    }

    const input = promptInputAdminTransferInfo();
    if (input == null) {
      return;
    }

    contractFactory.options.address = deployedContractAddr;
    const tx = await contractFactory.methods
      .setAdmin(input.address, input.pk)
      .send({
        from: account,
      });
    console.log(tx);
  };

  const setBaseUri = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (deployedContractAddr == null) {
      return alert("contract address is null, have you deploy yet?");
    }

    const url = promptInputBaseUri();
    if (url == null) {
      return;
    }

    contractFactory.options.address = deployedContractAddr;
    const tx = await contractFactory.methods.setBaseURI(url).send({
      from: account,
    });
    console.log(tx);
    fetchBaseUri();
  };

  const promptInputTokenPrice = () => {
    const price = window.prompt("Please enter CKB price per token", "100");
    if (price == null) {
      alert("price is null");
      return null;
    }

    const tokenPrice = web3Utils.toWei(price, "ether");
    return tokenPrice;
  };

  const promptInputWithdrawAmount = () => {
    const amount = window.prompt(
      `Please enter withdraw amount(Max ${balance} CKB)`,
      `${balance}`
    );
    if (amount == null) {
      alert("amount is null");
      return null;
    }

    const amountInWei = web3Utils.toWei(amount, "ether");
    return amountInWei;
  };

  const promptInputAdminTransferInfo = () => {
    const value = window.prompt(
      `Please enter admin address and encryption public key with , as splitter`,
      `${account},${encryptPk}`
    );
    if (value == null || value.split(",").length != 2) {
      alert("invalid input");
      return null;
    }

    return {
      address: value.split(",")[0],
      pk: value.split(",")[1],
    };
  };

  const promptInputBaseUri = () => {
    const url = window.prompt(
      `Please enter baseURI for this NFT`,
      `http://example.com`
    );
    if (url == null) {
      alert("url is null");
      return null;
    }

    return url;
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

            <Text>
              {"Token Price: " + tokenPrice} CKB --
              <a href="" onClick={changeTokenPrice}>
                Change Token Price
              </a>
            </Text>

            <Text>
              {"Balance: " + balance} CKB --
              <a href="" onClick={withdrawBalance}>
                Withdraw
              </a>
            </Text>

            <Text>
              {"Admin Address: " + admin}
              --
              <a href="" onClick={transferAdmin}>
                Transfer Admin
              </a>
            </Text>

            <Text>Token Holders: {totalReaders}</Text>

            <Text>
              {"NFT BaseURI: " + nftUrl}
              --
              <a href="" onClick={setBaseUri}>
                set base uri
              </a>
            </Text>
            {nftUrl && nftUrl.length === 0 && (
              <div>
                <Text>
                  You can set token base uri to show different image for your
                  NFT like below
                </Text>
                <img
                  style={{ width: "100px", height: "100px" }}
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                    avatar.random()
                  )}`}
                  alt=""
                />
              </div>
            )}
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
