import React from "react";
import { Grid } from "@material-ui/core";
import { Heading, Stack, Box, Text, Button } from "degen";

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
    width: "300px",
    height: "300px",
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
  code: {
    display: "block",
    margin: "20px",
    padding: "10px",
    textAlign: "left" as const,
  },
};

export function Home() {
  const direct2UserPage = () => {
    window.location.href = "/user";
  };

  return (
    <div style={styles.root}>
      <Grid container spacing={0}>
        <Grid item xs={12} style={styles.leftSide}>
          <Stack align={"center"}>
            <img
              style={styles.homeAvatar}
              src={process.env.PUBLIC_URL + "/seal-logo.png"}
              alt="Seal Blog"
            />{" "}
            <Box>
              <Heading></Heading>
              <Text
                transform="capitalize"
                align={"center"}
                variant="extraLarge"
              >
                one line code to{" "}
                <Text as="span" color="blue">
                  web3
                </Text>{" "}
                your blog
              </Text>
            </Box>
            <Box style={{ marginTop: "2em" }}>
              <Text variant="large">
                Turn your personal blog post encrypted and only readable with
                NFT membership token holder.
              </Text>
            </Box>
            <Box textAlign={"center"}>
              <pre>
                <code style={{ ...styles.code, ...styles.gridBg }}>
                  {`
<script src="../bundle/unseal.min.js" />
`}
                </code>
              </pre>
            </Box>
            <Box textAlign={"center"}>
              <Button
                onClick={direct2UserPage}
                width={{ xs: "full", md: "full" }}
              >
                Connect With Your Blog
              </Button>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </div>
  );
}
