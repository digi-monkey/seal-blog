import { Card, Grid } from "@material-ui/core";
import { Heading, Text, Button, IconCog } from "degen";
import React, { useContext, useEffect, useState } from "react";
import { Account } from "../metamask/account";
import { Token } from "../nft/Token";
import { styles as commonStyle } from "../style/styles";
import { Api } from "@seal-blog/sdk";
import { API_SERVER_URL } from "../../configs";
import { Network } from "../metamask/network";
import { PopupSelectChainId } from "../setting/setting";
import { Context } from "../../hooks/useContext";

const api = new Api(API_SERVER_URL);

const styles = {
  ...commonStyle,
  ...{
    root: {
      height: "500px",
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    },
  },
};

export function User() {
  const [account, setAccount] = useState<string>();
  const [encryptPk, setEncryptPk] = useState<string>();
  const [posts, setPosts] = useState<any[]>([]);

  const chainId = useContext(Context).network.selectChainId;

  useEffect(() => {
    if (account) {
      getPosts();
    }
  }, [account]);

  const write = async () => {
    try {
      await api.getContractAddress(chainId!, account!);
    } catch (error: any) {
      return alert(
        "You need to create an Readership NFT first! err: " + error.message
      );
    }
    window.location.href = "/write";
  };

  const getPosts = async () => {
    try {
      const res = await api.getPostIds(chainId!, account!);
      console.log(res);
      setPosts(res);
    } catch (error: any) {
      console.log(error.message);
      setPosts([]);
    }
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
      <Token account={account} encryptPk={encryptPk}></Token>
      <Button onClick={write} width={{ xs: "full", md: "full" }}>
        Write
      </Button>
      <hr />
      <Heading>Posts</Heading>
      {posts.map((p, id) => (
        <Card key={id} style={{ padding: "10px", margin: "20px 0" }}>
          <Grid container spacing={2}>
            <Grid item xs={10}>
              <Text>
                <a target={"_blank"} href={"/unseal?postId=" + p.postId}>
                  {p.postId}
                </a>
              </Text>
              <Text>{p.createdTs}</Text>
            </Grid>
            <Grid item xs={2}>
              <a
                style={{ display: "inline" }}
                target={"_blank"}
                href={"/post?postId=" + p.postId}
              >
                <IconCog />
              </a>
            </Grid>
          </Grid>
        </Card>
      ))}
    </div>
  );
}
