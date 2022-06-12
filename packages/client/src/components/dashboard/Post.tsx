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
import { Card, Grid } from "@material-ui/core";
import ReactMarkdown from "react-markdown";
import ReactDOMServer from "react-dom/server";

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
  article: {
    padding: "10px",
    margin: "10px",
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
  const [rawArticleData, setRawArticleData] = useState<string>();

  useEffect(() => {
    getTotalEnvelops();
    getKeyEnvelop();
    loadRawArticle();
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

  // todo: don't copy code from unseal page
  const loadRawArticle = async () => {
    const data = (await api.getPost(postId)).text;
    if (data === null) {
      return alert("load raw article failed...");
    }

    await setRawArticleData(data);
  };

  const copySealedPostMarkdown = async () => {
    /* Copy the markdown text inside the text field */
    setTimeout(async () => {
      await navigator.clipboard.writeText(rawArticleData!);
      alert("copy markdown text!");
    }, 300);
  };

  const copySealedPostHtml = async () => {
    const content = <ReactMarkdown>{rawArticleData!}</ReactMarkdown>;
    /* Copy the html text inside the text field */
    setTimeout(async () => {
      await navigator.clipboard.writeText(
        ReactDOMServer.renderToStaticMarkup(content)
      );
      alert("copy html text!");
    }, 300);
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
            <Grid container spacing={2}>
              <Grid item xs={7}>
                <Text transform="capitalize" size={"base"}>
                  Total Envelops: {envelops?.length}
                </Text>
              </Grid>
              <Grid item xs={5}>
                <Text transform="capitalize" size={"base"}>
                  <a href="" onClick={generateEnvelops}>
                    regenerate envelops
                  </a>
                </Text>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Text
                  transform="capitalize"
                  color={"textSecondary"}
                  size="small"
                >
                  an envelop is a encrypted aeskey-iv string specific for one
                  user to unlock the post. If someone subscribe your blog but
                  still fail to unlock the post, it might because of the missing
                  envelop. in that case, you can use the button above to
                  regenerate.
                </Text>
              </Grid>
            </Grid>
            <hr />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Text transform="capitalize" size={"base"}>
                  <a href="" onClick={revealKey}>
                    Reveal Encrypted AesKey And IV{" "}
                  </a>
                  (Admin Only)
                </Text>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {keyAndIv && (
                  <Text transform="capitalize" size={"base"}>
                    AesKey: {keyAndIv?.aesKey}, IV: {keyAndIv?.iv}
                  </Text>
                )}
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Text
                  transform="capitalize"
                  color={"textSecondary"}
                  size="small"
                >
                  AesKey And IV are the real key to unlock your post.
                </Text>
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
      <br />
      <Heading align={"center"}>Post Content</Heading>
      <br />
      <Grid style={{ padding: "10px", textAlign: "center" }}>
        <Text>
          <button onClick={copySealedPostMarkdown}>Copy Markdown</button>{" "}
          <button onClick={copySealedPostHtml}>Copy Html</button>
        </Text>
      </Grid>
      <Card style={styles.article}>
        <ReactMarkdown>{rawArticleData!}</ReactMarkdown>
      </Card>
    </div>
  );
}
