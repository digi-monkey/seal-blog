import {
  Api,
  decryptAESKey,
  HexStr,
  unSerializeAesKeyAndIv,
} from "@seal-blog/sdk";
import { Heading, Text } from "degen";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_SERVER_URL } from "../../configs";
import { Account } from "../metamask/account";
import { Grid } from "@material-ui/core";

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

interface KeyAndIv {
  aesKey: string;
  iv: string;
}

export function Post() {
  let query = useQuery();
  const _postId: HexStr | null = query.get("postId");
  if (_postId == null) {
    throw new Error("post id is null in query");
  }
  const postId: HexStr = _postId;

  const [envelops, setEnvelops] = useState<HexStr>();
  const [keyEnvelop, setKeyEnvelop] = useState<HexStr>();
  const [account, setAccount] = useState<HexStr>();
  const [keyAndIv, setKeyAndIv] = useState<KeyAndIv>();

  useEffect(() => {
    getTotalEnvelops();
    getKeyEnvelop();
  }, []);

  const getTotalEnvelops = async () => {
    const total = await api.getEnvelopsByPostId(postId);
    console.log(total);
    setEnvelops(total);
  };

  const generateEnvelops = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await api.generateEnvelops(postId);
    console.log(res);
  };

  const getKeyEnvelop = async () => {
    const res = await api.getKeyEnvelopByPostId(postId);
    console.log(res);
    setKeyEnvelop(res);
  };

  const revealKey = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (keyEnvelop == null || account == null) return;

    try {
      const res = await decryptAESKey(keyEnvelop, account);
      const keyObj: KeyAndIv = unSerializeAesKeyAndIv(res);
      setKeyAndIv(keyObj);
    } catch (error: any) {
      alert("Decrypt failed. Admin Only. Err: " + error.message);
    }
  };

  return (
    <div style={styles.root}>
      <Account accountCallback={setAccount} />
      <hr />

      <Grid container spacing={1}>
        <Grid item xs={12}>
          <br />
          <Heading align={"center"}>Post Manage</Heading>
          <br />
          <div style={styles.info}>
            Total Envelops: {envelops?.length} --
            <a href="" onClick={generateEnvelops}>
              ReGenerate Envelops
            </a>
            <Text>
              <a href="" onClick={revealKey}>
                Reveal Encrypted AesKey And IV{" "}
              </a>
              (Admin Only)
            </Text>
            <Text>
              AesKey: {keyAndIv?.aesKey} IV: {keyAndIv?.iv}
            </Text>
          </div>
        </Grid>
      </Grid>
    </div>
  );
}
