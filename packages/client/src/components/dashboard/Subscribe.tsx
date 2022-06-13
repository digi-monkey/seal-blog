import { Api, getEncryptionPublicKey, HexStr } from "@seal-blog/sdk";
import { Button, Heading, Text } from "degen";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { contractFactory, isSubscriber, subscribe } from "../../api";
import { API_SERVER_URL } from "../../configs";
import { Account } from "../metamask/account";
import web3Util from "web3-utils";
import { Card, Grid } from "@material-ui/core";
import { Price } from "../../api/price";

const api = new Api(API_SERVER_URL);

const styles = {
  root: {
    height: "500px",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
  },
  info: {
    maxWidth: "600px",
    margin: "2em auto",
    padding: "1em",
    border: "1px solid gray",
  },
  subArea: {
    margin: "2em 5px",
  },
  hintText: {
    padding: "5px",
    fontSize: "12px",
    color: "gray",
  },
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function Subscribe() {
  let query = useQuery();
  const _contractAddress: HexStr | null = query.get("contract");
  if (_contractAddress == null) {
    throw new Error("contractAddress is null in query");
  }
  const contractAddress: HexStr = web3Util.toChecksumAddress(_contractAddress);
  contractFactory.options.address = contractAddress;

  const [author, setAuthor] = useState<HexStr>();
  const [account, setAccount] = useState<HexStr>();
  const [isSub, setIsSub] = useState<boolean>();
  const [tokenPrice, setTokenPrice] = useState<string>();
  const [totalTokens, setTotalTokens] = useState<string>();
  const [nftImages, setNftImages] = useState<string[]>([]);
  const [baseUri, setBaseUri] = useState<string>();
  const [ckbPrice, setCkbPrice] = useState<string>();

  useEffect(() => {
    requestAuthor();
    getTokenPrice();
    getTotalTokens();
    getBaseUri();
    fetchCkbPrice();
  }, []);

  useEffect(() => {
    checkIsSubscribe();
  }, [account]);

  useEffect(() => {
    getAllTokenUri();
  }, [totalTokens]);

  const requestAuthor = async () => {
    const au = await api.getContractOwner(contractAddress);
    setAuthor(au);
  };

  const checkIsSubscribe = async () => {
    if (!account) return;

    const res = await isSubscriber(contractFactory, account);
    setIsSub(res);
  };

  const getTokenPrice = async () => {
    const price = await contractFactory.methods.tokenPrice().call();
    setTokenPrice(web3Util.fromWei(price));
  };

  const getTotalTokens = async () => {
    const total = await contractFactory.methods.totalTokens().call();
    setTotalTokens(total);
  };

  const getTokenUri = async (tokenId: number) => {
    const uri = await contractFactory.methods.tokenURI(tokenId).call();
    return uri;
  };

  const getAllTokenUri = async () => {
    const total = +(totalTokens || 0);
    const newData = nftImages;
    for (let i = 1; i < total + 1; i++) {
      const uri = await getTokenUri(i);
      newData.push(uri);
    }
    setNftImages(newData);
  };

  const getBaseUri = async () => {
    const uri = await contractFactory.methods.baseUri().call();
    setBaseUri(uri);
  };

  const subscribeBtn = async () => {
    if (!account) return;

    const pk = await getEncryptionPublicKey(account);
    if (!pk) return;

    const res = await subscribe(contractFactory, account, pk);
    return res;
  };

  const fetchCkbPrice = async () => {
    const priceApi = new Price();
    const ckbPrice = await priceApi.ckbUsd();
    setCkbPrice(ckbPrice);
  };

  const avatars =
    baseUri && baseUri.length > 0
      ? nftImages.map((i, index) => (
          <img
            key={index}
            style={{ width: "60px", height: "60px" }}
            src={i + ".svg"}
            alt=""
          />
        ))
      : nftImages.map((i, index) => <span key={index}>nft metadata: {i}</span>);

  return (
    <div style={styles.root}>
      <Account accountCallback={setAccount} />
      <hr />

      <Grid container spacing={1}>
        <Grid item xs={12}>
          <br />
          <Heading align={"center"}>NFT Readership Token By SealBlog</Heading>
          <br />
          <div style={styles.info}>
            {avatars}
            <Card style={{ padding: "10px", margin: "5px", fontSize: "17px" }}>
              <Text lineHeight={2}>Contract: {contractAddress}</Text>
              <Text lineHeight={2}>Author: {author}</Text>
              <Text lineHeight={2}></Text>
              <Text lineHeight={2}>
                Current Price: {tokenPrice} CKB(
                {(+ckbPrice! * +tokenPrice!).toFixed(2)} USD), {"    "}Total
                Subscribers: {totalTokens}
              </Text>
            </Card>
            <div style={styles.subArea}>
              <p style={styles.hintText}>
                By subscribe, you will be able to read the content and mint an
                unique Erc721 readership token. <a href="/nft">More info</a>
              </p>
              <Button
                onClick={subscribeBtn}
                width={{ xs: "full", md: "full" }}
                disabled={!!isSub}
              >
                {" "}
                Subscribe{" "}
              </Button>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
}
