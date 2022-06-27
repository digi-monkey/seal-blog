import React, { useContext, useEffect, useState } from "react";
import { Card } from "@material-ui/core";
import { Text } from "degen";
import { contractFactory, CONTRACT_ARTIFACT, web3 } from "../../api/web3";
import web3Utils from "web3-utils";
import { Api } from "@seal-blog/sdk";
import {
  API_SERVER_URL,
  getChainNetwork,
  getTokenPriceIdBySymbol,
} from "../../configs";
import { avatar } from "../../api";
import { Price } from "../../api/price";
import { Context } from "../../hooks/useContext";

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
  const [maxSupply, setMaxSupply] = useState<string>();
  const [stopMintingCursor, setStopMintingCursor] = useState<string>();
  const [admin, setAdmin] = useState("");
  const [nftUrl, setNftUrl] = useState<string>();
  const [isDeployed, setIsDeployed] = useState(false);
  const [deployedContractAddr, setDeployedContractAddr] = useState<string>();
  const [nativeTokenPrice, setNativeTokenPrice] = useState<string>();
  const [nativeTokenSymbol, setNativeTokenSymbol] = useState<string>();

  const chainId = useContext(Context).network.selectChainId;

  useEffect(() => {
    fetchNativeTokenPrice();
  }, []);

  useEffect(() => {
    if (chainId) {
      const symbol = getChainNetwork(chainId).nativeCurrency.symbol;
      setNativeTokenSymbol(symbol);
    }
  }, [chainId]);

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
    fetchMaxSupply();
    fetchStopMintingCursor();
  }, [deployedContractAddr]);

  const fetchTotalReaders = async () => {
    const totalReaders = await contractFactory.methods.totalTokens().call();
    setTotalReaders(totalReaders);
  };

  const fetchTokenPrice = async () => {
    const value = await contractFactory.methods.tokenPrice().call();
    const tokenPrice = web3Utils.fromWei(value);
    setTokenPrice(+tokenPrice);
  };

  const fetchContractBalance = async () => {
    const bal = await web3.eth.getBalance(deployedContractAddr!);
    const balance = web3Utils.fromWei(bal);
    setBalance(+balance);
  };

  const fetchAdminAddress = async () => {
    const adminAddr = await contractFactory.methods.admin().call();
    setAdmin(adminAddr);
  };

  const fetchMaxSupply = async () => {
    const maxSupply = await contractFactory.methods.maxSupply().call();
    setMaxSupply(maxSupply);
  };

  const fetchStopMintingCursor = async () => {
    const cursor = await contractFactory.methods.stopMintingCursor().call();
    setStopMintingCursor(cursor);
  };

  const fetchBaseUri = async () => {
    const url = await contractFactory.methods.baseUri().call();
    setNftUrl(url);
  };

  const fetchContractAddress = async () => {
    if (!account) return;
    if (!chainId) return;

    try {
      const addr = await api.getContractAddress(chainId!, account);
      setDeployedContractAddr(addr);
      setIsDeployed(true);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const fetchNativeTokenPrice = async () => {
    if (!chainId) return;

    const priceApi = new Price();
    const chainNetwork = getChainNetwork(chainId);
    const tokenPriceId = getTokenPriceIdBySymbol(
      chainNetwork.nativeCurrency.symbol
    );
    const ckbPrice = await priceApi.tokenUsd(tokenPriceId);
    setNativeTokenPrice(ckbPrice);
  };

  const deploy = async () => {
    if (isDeployed) {
      const isConfirm = window.confirm(
        "You already has an nft contract! This might abandon the previous NFT usage in current Seal version!\n\nStill want to deploy a new one?"
      );
      if (!isConfirm) return;
    }

    const tokenPrice = await promptInputTokenPrice();
    if (tokenPrice == null) {
      return;
    }

    const maxSupply = await promptInputMaxSupply();
    if (maxSupply == null) {
      return;
    }

    const defaultStopMintingCursor = 0;
    const tokenAdminAddr = account;
    const pk = encryptPk;
    const params = [
      tokenPrice,
      tokenAdminAddr,
      pk,
      +maxSupply,
      defaultStopMintingCursor,
    ];

    console.log(params);

    await contractFactory
      .deploy({
        data: CONTRACT_ARTIFACT.bytecode,
        arguments: params,
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
        const res = await api.bindContract(chainId!, txHash);
        console.log("bind contract:", res);
      });
  };

  const changeTokenPrice = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (deployedContractAddr == null) {
      return alert("contract address is null, have you deploy yet?");
    }

    const tokenPrice = await promptInputTokenPrice();
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

  const changeStopMintingCursor = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (deployedContractAddr == null) {
      return alert("contract address is null, have you deploy yet?");
    }

    const cursor = await promptInputStopMintingCursor();
    if (cursor == null) {
      return;
    }

    contractFactory.options.address = deployedContractAddr;
    const tx = await contractFactory.methods.setStopMintingCursor(cursor).send({
      from: account,
    });
    console.log(tx);
    await fetchStopMintingCursor();
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

  const promptInputTokenPrice = async () => {
    const price = window.prompt(
      `Please enter ${nativeTokenSymbol} price per your NFT token`,
      "100"
    );
    if (price == null) {
      alert("price is null");
      return null;
    }

    const tokenPrice = web3Utils.toWei(price, "ether");
    return tokenPrice;
  };

  const promptInputMaxSupply = async () => {
    const maxSupply = window.prompt(
      `Max limit for total NFT tokens(0 means no hard cap limit)`,
      "0"
    );
    if (maxSupply == null) {
      alert("maxSupply is null");
      return null;
    }
    if (+maxSupply < 0) {
      alert("maxSupply must be 0 or > 0");
      return null;
    }

    return maxSupply;
  };

  const promptInputStopMintingCursor = async () => {
    const cursor = window.prompt(
      `Stop minting at token id (0 means no stop)`,
      "0"
    );
    if (cursor == null) {
      alert("cursor is null");
      return null;
    }
    if (+cursor < 0) {
      alert("cursor must be 0 or > 0");
      return null;
    }

    return cursor;
  };

  const promptInputWithdrawAmount = () => {
    const amount = window.prompt(
      `Please enter withdraw amount(Max ${balance} ${nativeTokenSymbol})`,
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
        <Text>
          {nativeTokenSymbol}/USD: {nativeTokenPrice}
        </Text>
        <h1>Your Readership NFT</h1>
        {isDeployed && (
          <div>
            <Text>
              Contract Address:{" "}
              <a
                href={`/subscribe?chain_id=${chainId}&contract=${deployedContractAddr}`}
              >
                {deployedContractAddr}
              </a>
            </Text>

            <Text transform="capitalize">
              {"Token Price: " + tokenPrice} {nativeTokenSymbol}(
              {(+nativeTokenPrice! * tokenPrice).toFixed(2)} USD) --
              <a href="" onClick={changeTokenPrice}>
                Change Token Price
              </a>
            </Text>

            <Text transform="capitalize">
              {"Balance: " + balance} {nativeTokenSymbol}(
              {(+nativeTokenPrice! * balance).toFixed(2)} USD) --
              <a href="" onClick={withdrawBalance}>
                Withdraw
              </a>
            </Text>

            <Text transform="capitalize">
              {"Admin Address: " + admin}
              --
              <a href="" onClick={transferAdmin}>
                Transfer Admin
              </a>
            </Text>

            <Text transform="capitalize">
              {"Max Supply Limit: "}
              {maxSupply === "0" ? "No Hard cap" : maxSupply}
            </Text>

            <Text transform="capitalize">
              {stopMintingCursor != null && stopMintingCursor != "0" && (
                <span>Stop Minting at Token Id: {stopMintingCursor}</span>
              )}
              {stopMintingCursor === "0" && (
                <span>stopMintingCursor: Not Set</span>
              )}{" "}
              ( Mint method will be temporarily disabled after this cursor
              value(tokenId)) --
              <a href="" onClick={changeStopMintingCursor}>
                Change Stop Minting Cursor
              </a>
            </Text>

            <Text transform="capitalize">Token Holders: {totalReaders}</Text>

            <Text transform="capitalize">
              {"NFT BaseURI: " + nftUrl}
              --
              <a href="" onClick={setBaseUri}>
                Set Base URI
              </a>
            </Text>
            {(!nftUrl || (nftUrl && nftUrl.length === 0)) && (
              <div>
                <Text transform="capitalize">
                  BaseURI is not set. You can set token base uri to show
                  different image for your NFT like below
                </Text>
                <img
                  style={{ width: "100px", height: "100px" }}
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                    avatar.random()
                  )}`}
                  alt="example uri"
                />
                example uri to render NFT img
              </div>
            )}
          </div>
        )}
        <hr />
        {
          <div>
            <Text transform="capitalize">No Contract/Not Your Contract?</Text>
            <Text transform="capitalize" variant="large">
              <button className="block" onClick={deploy}>
                Create New One
              </button>
            </Text>
            <Text transform="capitalize">
              <a href="/nft/info">learn more</a>
            </Text>
          </div>
        }
      </Card>
    </div>
  );
}
