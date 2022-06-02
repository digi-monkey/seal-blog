import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Stack } from "degen";
import { Grid } from "@material-ui/core";
import ReactLoading from "react-loading";
import { useLocation } from "react-router-dom";
import { Api } from "@seal-blog/sdk";
import { API_SERVER_URL } from "../../configs";
import { contractFactory, getFirstTokenId } from "../../api/web3";
import web3Utils from "web3-utils";

import "@seal-blog/sdk/lib/js-script";

const api = new Api(API_SERVER_URL);

const styles = {
  root: {
    maxWidth: "1000px",
    margin: "auto",
    marginTop: "2em",
    background: "#FCFDFB",
    minHeight: "80vh",
    borderRadius: "25px",
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
    minHeight: "50vh",
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
  heading: {
    color: "rgb(236, 236, 236)",
    fontSize: "40px",
  },
  hr: {
    height: "1px",
    backgroundColor: "rgb(236, 236, 236)",
    border: "none",
  },
  gridBg: {
    background: "#FCFDFB",
    backgroundImage:
      "linear-gradient(rgb(236, 236, 236) 1px, transparent 0), linear-gradient(90deg, rgb(236, 236, 236) 1px, transparent 0), linear-gradient(white 1px, transparent 0), linear-gradient(90deg, white 1px, transparent 0)",
    backgroundSize: `
      30px 30px,
      30px 30px,
      75px 75px,
      75px 75px
    `,
  },
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function Unseal() {
  let query = useQuery();
  const postId = query.get("postId");
  if (postId == null) {
    throw new Error("postId is null in query");
  }
  const [rawArticleData, setRawArticleData] = useState<string>();
  const [isRawArticleLoading, setIsRawArticleLoading] =
    useState<boolean>(false);
  const [isRawArticleLoadFailed, setIsRawArticleLoadFailed] =
    useState<boolean>(false);

  const [contractAddress, setContractAddress] = useState<string>();
  const [account, setAccount] = useState<string>();
  const [encryptionPublicKey, setEncryptionPublicKey] = useState<string>();

  useEffect(() => {
    loadRawArticle();
    connectWallet();

    const addr = web3Utils.toChecksumAddress(
      "0x" + postId.slice(2).slice(16, 56)
    );
    setContractAddress(addr);
  }, []);

  useEffect(() => {
    if (account != null) {
      getEncryptionPublicKey(account);
    }
  }, [account]);

  const loadRawArticle = async () => {
    setIsRawArticleLoading(true);
    const data = (await api.getPost(postId)).text;
    if (data === null) {
      // sometimes the tx will be load failed with empty string
      // we need to inform user to refresh pages
      console.log("load raw article failed...");
      await setIsRawArticleLoadFailed(true);
      return;
    }

    await setIsRawArticleLoadFailed(false);
    await setRawArticleData(data);
    setIsRawArticleLoading(false);
  };

  const subscribe = async () => {
    if (contractAddress == null) {
      return alert("contract address is null!");
    }

    contractFactory.options.address = contractAddress;
    const tokenPrice = await contractFactory.methods.tokenPrice().call();
    console.log(tokenPrice);
    const tx = await contractFactory.methods
      .mint(account)
      .send({ from: account, value: tokenPrice });
    console.log(tx);
  };

  const setPk = async () => {
    if (contractAddress == null) {
      return alert("contract address is null!");
    }
    if (account == null) {
      return alert("account address is null!");
    }

    contractFactory.options.address = contractAddress;
    const tokenId = await getFirstTokenId(contractFactory, account);
    const tx = await contractFactory.methods
      .setEncryptPublicKey(tokenId, encryptionPublicKey)
      .send({ from: account });
    console.log(tx);
  };

  // todo: refactor, don't copy code from account.tsx
  const connectWallet = async () => {
    if (!account) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      await setAccount(accounts[0]);
      listenForAccountChanged();
    }
  };

  const listenForAccountChanged = () => {
    window.ethereum.on("accountsChanged", handleAccountChanged);
    function handleAccountChanged(account: string) {
      if (account.length > 0) {
        setAccount(account[0]);
      } else {
        setAccount(undefined);
      }
    }
  };

  const getEncryptionPublicKey = async (account: string) => {
    const encryptionPublicKey =
      localStorage.getItem(account) ||
      (await requestEncryptionPublicKeyFromMetamask(account));
    await setEncryptionPublicKey(encryptionPublicKey);
    return encryptionPublicKey;
  };

  const requestEncryptionPublicKeyFromMetamask = async (account: string) => {
    if (
      window.confirm(
        "we want to store your signing publicKey on browser for connivent, good?"
      )
    ) {
      // Save it
      const pk = (await window.ethereum.request({
        method: "eth_getEncryptionPublicKey",
        params: [account], // you must have access to the specified account
      })) as string;
      localStorage.setItem(account, pk);
      return pk;
    } else {
      // Do nothing!
      alert(
        "will not store on browser, will ask your metamask each time you need it."
      );
      return undefined;
    }
  };

  return (
    <div style={styles.root}>
      <Grid container spacing={0}>
        <Grid item xs={9} style={styles.leftSide}>
          {isRawArticleLoading && (
            <Stack>
              <h4>Loading..</h4>
              <ReactLoading type={"balls"} color="#000" />
            </Stack>
          )}
          <div style={styles.heading}>
            <span style={styles.heading}>Reading</span>
            <hr style={styles.hr} />
          </div>

          <p>
            {isRawArticleLoadFailed
              ? "Failed to load raw article, try refresh pages later."
              : ""}
          </p>
          <div style={styles.content}>
            <ReactMarkdown>{rawArticleData!}</ReactMarkdown>
          </div>

          <div style={styles.footnote}>
            <div style={styles.footnoteLink}>
              Power by{" "}
              <a target={"_blank"} href="https://github.com">
                Seal Blog
              </a>{" "}
              {"can't decrypt? you need to subscribe and set pk first!"}{" "}
              <button onClick={subscribe}>subscribe</button>{" "}
              <button onClick={setPk}>set pk</button>
            </div>
          </div>
        </Grid>
        <Grid item xs={3}></Grid>
      </Grid>
    </div>
  );
}
