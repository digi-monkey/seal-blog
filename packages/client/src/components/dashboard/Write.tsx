import { TextField } from "@material-ui/core";
import { Button, Stack, IconUpload } from "degen";
import React, { useEffect, useReducer, useState } from "react";
import {
  Api,
  sealPost,
  generateRandomAesKey,
  generateRandomIv,
} from "@seal-blog/sdk";
import { Account } from "../metamask/account";
import ReactMarkdown from "react-markdown";
import { API_SERVER_URL, CLIENT_URL } from "../../configs";

import "@seal-blog/sdk/lib/js-script";

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
  const [chainId, setChainId] = useState<string>();
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
    if (account != null) {
      getContractAddress(account);
    }
  }, [account]);

  const handleSubmit = async (evt: { preventDefault: () => void }) => {
    if (chainId == null || account == null) {
      return alert(`chain id / account not found!`);
    }

    const chainIdHex = "0x" + BigInt(chainId).toString(16);

    evt.preventDefault();
    let data = { formInput };
    const key = generateRandomAesKey();
    const iv = generateRandomIv();
    console.log(data, "key:", key, "iv:", iv);
    const [postId, t] = sealPost(
      data.formInput.text,
      key,
      iv,
      `${CLIENT_URL}/unseal`,
      chainIdHex,
      contractAddress!
    );
    setPost(t);
    console.log(t);
    const res = await api.addPost(account, t, key, iv, postId, chainIdHex);
    console.log(res);
  };

  const handleInput = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const name = evt.target.name;
    const newValue = evt.target.value;
    setFormInput({ [name]: newValue });
  };

  const copySealedPost = async () => {
    /* Copy the text inside the text field */
    setTimeout(async () => {
      await navigator.clipboard.writeText(post);
      alert("copy text!");
    }, 300);
  };

  const getContractAddress = async (account: string) => {
    const addr = await api.getContractAddress(account);
    setContractAddress(addr);
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
              <button onClick={copySealedPost}>Copy</button> the following
              sealed post to your blog
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
