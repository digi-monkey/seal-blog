import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Stack } from "degen";
import { Grid } from "@material-ui/core";
import ReactLoading from "react-loading";
import { useLocation } from "react-router-dom";
import { Api } from "@seal-blog/sdk";
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

  useEffect(() => {
    loadRawArticle();
  }, []);

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

          <p>
            {isRawArticleLoadFailed
              ? "Failed to load raw article from arweave transaction, try refresh pages later."
              : ""}
          </p>
          <div style={styles.content}>
            <ReactMarkdown>{rawArticleData!}</ReactMarkdown>
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
