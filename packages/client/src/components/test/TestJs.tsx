import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button, Stack, Box } from "degen";
import { Grid } from "@material-ui/core";
import ReactLoading from "react-loading";
import { parseRawPost } from "@seal-blog/sdk";
import { Account } from "../metamask/account";
import { useLocation } from "react-router-dom";
import { contractFactory, getFirstTokenId } from "../../api/web3";
import { main, Api, decrypt } from "@seal-blog/sdk";
import { API_SERVER_URL } from "../../configs";

const api = new Api(API_SERVER_URL);

const styles = {
  root: {
    maxWidth: "1000px",
    margin: "auto",
    marginTop: "2em",
    background: "#FCFDFB",
    minHeight: "80vh",
    borderRadius: "25px",
    boxShadow: "2px 2px 2px 2px black",
  },
  leftSide: {
    padding: "6em",
  },
  header: {
    fontSize: "18px",
    marginBottom: "4em",
  },
  dateTime: {
    color: "#8A9282",
  },
  sidebar: {
    background: "#F4F5EF",
    padding: "1em",
    paddingTop: "2em",
  },
  content: {
    marginTop: "4em",
  },
  homeAvatar: {
    width: "150px",
    height: "150px",
  },
  blogTitle: {
    width: "150px",
    fontSize: "12px",
    marginLeft: "30px",
    padding: "5px",
    color: "gray",
  },
  footnote: {
    marginTop: "4em",
    width: "100%",
    color: "gray",
    border: "1px solid #ECECEC",
    borderRadius: "0.5rem",
    fontWeight: 400,
    overflow: "hidden",
  },
  footnoteLink: {
    width: "100%",
    display: "inline-block",
    padding: "10px",
    textDecoration: "none",
    borderBottom: "1px solid #ECECEC",
    color: "gray",
    overflow: "hidden",
  },
  footnoteRightValue: {
    marginLeft: "10px",
  },
  link: {
    color: "blue",
    padding: "5px",
    border: "1px solid blue",
    margin: "5px 5px",
    cursor: "pointer",
  },
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function TestJs() {
  let query = useQuery();
  const hashId = query.get("hashId");
  if (hashId == null) {
    throw new Error("hashId is null in query");
  }
  const [_account, setAccount] = useState<string>();
  const [_encryptedAESKey, setEncryptedAESKey] = useState<string>();
  const [rawArticleData, setRawArticleData] = useState<string>();
  const [article, setArticle] = useState<string>();
  const [isRawArticleLoading, setIsRawArticleLoading] =
    useState<boolean>(false);
  const [isRawArticleLoadFailed, setIsRawArticleLoadFailed] =
    useState<boolean>(false);
  const [isDecryptLoading, setIsDecryptLoading] = useState<boolean>(false);
  const [isDecrypted, setIsDecrypted] = useState<boolean>(false);
  const [result, setResult] = useState<string>();
  const [isNoAuth, setIsNoAuth] = useState(false);
  const [title, setTitle] = useState<string>();
  const [dateTime, setDateTime] = useState<string>();
  const [pk, setPk] = useState<string>();
  const [contractAddress, setContractAddress] = useState<string>();

  useEffect(() => {
    loadRawArticle();
    setDateTime("2012.12.3");
    getContractAddress();
  }, []);

  const loadRawArticle = async () => {
    setIsRawArticleLoading(true);
    const data = (await api.getPost(hashId)).text; //await arApi.getTransactionData(txHash);
    if (data === null) {
      // sometimes the tx will be load failed with empty string
      // we need to inform user to refresh pages
      console.log("load raw article failed...");
      await setIsRawArticleLoadFailed(true);
      return;
    }

    await setIsRawArticleLoadFailed(false);
    await setRawArticleData(data);
    await setArticle(data);
    main();
    setIsRawArticleLoading(false);
  };

  const getAccount = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    await setAccount(accounts[0]);
    return accounts[0];
  };

  const decryptAESKey = async (encryptedMessage: string, account: string) => {
    const decryptedMessage = await window.ethereum.request({
      method: "eth_decrypt",
      params: [encryptedMessage, account],
    });
    await setEncryptedAESKey(decryptedMessage); // double encrypt, so the aes key is still one last layer encrypted, which only be able to decrypt from server.
    return decryptedMessage;
  };

  const _decryptArticle = async (aesKey: string, iv: string) => {
    if (aesKey == null) {
      alert("AESKEY is null!");
    } else {
      const result = await parseRawPost(rawArticleData!);
      const encryptText = result.encryptText;
      const _article =
        result.header + (await decrypt(encryptText!, aesKey, iv)) + result.tail;
      if (_article == null) {
        console.log("cannot decrypt");
        setIsDecrypted(true);
        return;
      }
      setIsDecrypted(true);
      const article = formatArticle(_article);
      setArticle(article);
    }
  };

  const formatArticle = (article: string) => {
    const regex = /\# .+/g;
    const title = article.match(regex);
    if (title != null) {
      setTitle(title[0]);
    }

    const content = article.replace(regex, "");
    return content;
  };

  const decryptArticle = async () => {
    await setIsDecryptLoading(true);
    const account = await getAccount();
    let envelop;
    try {
      envelop = (await api.getEnvelopByHashIdAndPk(hashId, pk!)).envelop;
      console.log(envelop);
    } catch (error: any) {
      await setResult(
        "sorry, you are not allow to read this article. err: " + error.message
      );
      setIsNoAuth(true);
    }
    if (envelop != null) {
      const s = await decryptAESKey(envelop, account);
      const aesKey = s.slice(0, 32);
      const iv = s.slice(32);
      console.log("envelop decrypted =>", aesKey, iv);
      await _decryptArticle(aesKey, iv);
    }
    setIsDecryptLoading(false);
  };

  const getContractAddress = async () => {
    const contractAddress = await api.getContractAddressByHashId(hashId);
    setContractAddress(contractAddress);
  };

  const subscribe = async () => {
    contractFactory.options.address = contractAddress!;
    const tokenPrice = await contractFactory.methods.tokenPrice().call();
    console.log(tokenPrice);
    const tx = await contractFactory.methods
      .mint(_account)
      .send({ from: _account, value: tokenPrice });
    console.log(tx);
  };

  const uploadPk = async () => {
    contractFactory.options.address = contractAddress!;
    const tokenId = await getFirstTokenId(contractFactory, _account!);
    const tx = await contractFactory.methods
      .setEncryptPublicKey(tokenId, pk)
      .send({ from: _account });
    console.log(tx);
  };

  return (
    <div style={styles.root}>
      <Account encryptionPublicKeyCallback={setPk} />
      <Grid container spacing={0}>
        <Grid item xs={9} style={styles.leftSide}>
          <p>
            <a href={document.referrer} target={"_blank"}>
              {"<-"} back
            </a>
          </p>
          <Stack space="px" direction="horizontal" wrap>
            <Box backgroundColor="foregroundSecondary" sizes="16">
              {rawArticleData && !isDecrypted && !isRawArticleLoadFailed && (
                <Button width="full" onClick={decryptArticle}>
                  decrypt article
                </Button>
              )}
            </Box>
            {isDecrypted && (
              <div>
                <ReactMarkdown>{title as any}</ReactMarkdown>
                <div style={styles.dateTime}>{dateTime}</div>
              </div>
            )}
          </Stack>

          {isRawArticleLoading && (
            <Stack>
              <h4>Loading..</h4>
              <ReactLoading type={"balls"} color="#000" />
            </Stack>
          )}

          <p>
            {isRawArticleLoadFailed
              ? "Failed to load raw article from arweave transaction, try refresh pages later."
              : ""}
          </p>
          <p>
            {isDecryptLoading && !isDecrypted
              ? "decrypting article...please wait.."
              : ""}
          </p>
          <p>{result}</p>
          <p>
            {isNoAuth && (
              <div>
                please subscribe to author with NFT to read this article
                <a style={styles.link} onClick={subscribe}>
                  subscribe
                </a>
                <a style={styles.link} onClick={uploadPk}>
                  set pk
                </a>
              </div>
            )}
          </p>
          <div style={styles.content}>
            <ReactMarkdown>{article!}</ReactMarkdown>
          </div>

          <div style={styles.footnote}>
            <div style={styles.footnoteLink}>
              Power by{" "}
              <a target={"_blank"} href="https://github.com">
                Seal
              </a>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
}
