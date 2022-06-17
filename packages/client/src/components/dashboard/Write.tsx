import { TextField } from "@material-ui/core";
import { Button, Stack, IconUpload } from "degen";
import React, { useEffect, useReducer, useState } from "react";
import ReactDOMServer from "react-dom/server";
import {
  Api,
  sealPost,
  generateRandomAesKey,
  generateRandomIv,
  addDecryptButton,
  HexNum,
  HexStr,
} from "@seal-blog/sdk";
import { Account } from "../metamask/account";
import ReactMarkdown from "react-markdown";
import { API_SERVER_URL, CLIENT_URL } from "../../configs";

const api = new Api(API_SERVER_URL);

const styles = {
  root: {
    height: "500px",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
  },
};

export function Write() {
  const [post, setPost] = useState("");
  const [account, setAccount] = useState<string>();
  const [chainId, setChainId] = useState<HexNum>();
  const [contractAddress, setContractAddress] = useState<string>();

  const [formInput, setFormInput] = useReducer(
    (state: any, newState: any) => ({ ...state, ...newState }),
    {
      text: "",
      time: Date.now(),
      author: account,
    }
  );

  useEffect(() => {
    if (account != null && chainId != null) {
      getContractAddress(chainId, account);
    }
  }, [account, chainId]);

  const handleSubmit = async (evt: { preventDefault: () => void }) => {
    if (chainId == null || account == null) {
      return alert(`chain id / account not found!`);
    }

    evt.preventDefault();
    let data = { formInput };
    const key = generateRandomAesKey();
    const iv = generateRandomIv();
    const [postId, t] = sealPost(
      data.formInput.text,
      key,
      iv,
      `${CLIENT_URL}/unseal`,
      chainId,
      contractAddress!
    );
    setPost(t);
    console.log(t);
    const res = await api.addPost(account, t, key, iv, postId, chainId);
    console.log(res);

    // add decrypt function
    addDecryptButton(API_SERVER_URL, CLIENT_URL);
  };

  const handleInput = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const name = evt.target.name;
    const newValue = evt.target.value;
    setFormInput({ [name]: newValue });
  };

  const copySealedPostMarkdown = async () => {
    /* Copy the markdown text inside the text field */
    setTimeout(async () => {
      await navigator.clipboard.writeText(post);
      alert("copy text!");
    }, 300);
  };

  const copySealedPostHtml = async () => {
    const content = <ReactMarkdown>{post}</ReactMarkdown>;
    /* Copy the html text inside the text field */
    setTimeout(async () => {
      await navigator.clipboard.writeText(
        ReactDOMServer.renderToStaticMarkup(content)
      );
      alert("copy text!");
    }, 300);
  };

  const getContractAddress = async (chainId: HexNum, account: HexStr) => {
    try {
      const addr = await api.getContractAddress(chainId, account);
      console.log("contractAddress: ", addr, chainId);
      setContractAddress(addr);
    } catch (error: any) {
      alert("You need to create readership NFT first, err:" + error.message);
    }
  };

  return (
    <div style={styles.root}>
      <Account accountCallback={setAccount} chainIdCallBack={setChainId} />
      <hr />
      {contractAddress != null && (
        <div>
          <form onSubmit={handleSubmit} style={{ marginBottom: "40px" }}>
            <TextField
              label="Write Markdown Post"
              name="text"
              style={{
                width: "100%",
                textAlign: "left",
                margin: "20px 0 5px 0",
              }}
              multiline
              variant="outlined"
              rows={30}
              placeholder={
                "This is where I want everyone to see. \n\nAnd by inserting an magic phrase like below, I will seal the content only for my readers!\n\n---seal---\n\nThis is where all the content will be encrypted.\n\nOnly readers hold NFT can read it."
              }
              onChange={handleInput}
            />
            <Stack>
              <Button
                type="submit"
                prefix={<IconUpload />}
                variant="secondary"
                width={{ xs: "full", md: "max" }}
              >
                Submit
              </Button>
            </Stack>
          </form>
          <hr />
          <div>
            <p>
              {" "}
              <button onClick={copySealedPostMarkdown}>
                Copy Markdown
              </button>{" "}
              <button onClick={copySealedPostHtml}>Copy Html</button> to your
              blog
            </p>
            <div style={{ margin: "20px 0" }}>
              <div
                style={{
                  borderRadius: "5px",
                  border: "1px solid gray",
                  padding: "10px 20px",
                  minHeight: "300px",
                }}
              >
                <ReactMarkdown>{post}</ReactMarkdown>
              </div>
            </div>
            <hr />
          </div>
        </div>
      )}
    </div>
  );
}
