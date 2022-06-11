import React from "react";
import { Grid } from "@material-ui/core";
import { Stack, Box, Text, Button } from "degen";

import { version as sdkVersion } from "@seal-blog/sdk/package.json";
const { version } = require("../../../package.json");

const styles = {
  root: {
    maxWidth: "1000px",
    margin: "auto",
    marginTop: "2em",
    minHeight: "80vh",
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
    background: "#B8C5D6",
    borderRadius: "15px",
  },
  pre: {
    lineHeight: "10px",
    padding: "16px",
    overflow: "auto",
    backgroundColor: "#B8C5D6",
    borderRadius: "6px",
  },
  code: {
    display: "block",
    margin: "20px",
    padding: "10px",
    textAlign: "left" as const,
    lineHeight: "12px",
  },
  describe: {
    marginTop: "4em",
    padding: "10px 20px",
    background: "#EDF5FC",
    borderRadius: "1px",
  },
  versionTag: {
    verticalAlign: "top",
    padding: "10px",
    borderRadius: "10px",
    background: "#EDF5FC",
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
            <div>
              <img
                style={styles.homeAvatar}
                src={process.env.PUBLIC_URL + "/seal-logo.png"}
                alt="Seal Blog"
              />
              <span style={styles.versionTag}>v{version}</span>
            </div>{" "}
            <Box>
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
            <Box textAlign={"center"}>
              <pre style={styles.pre}>
                <code>
                  {`
<script src="https://cdn.jsdelivr.net/npm/@seal-blog/sdk@v${sdkVersion}/bundle/unseal.min.js" />
`}
                </code>
              </pre>
            </Box>
            <Box>
              <Text variant="large">
                Turn your personal blog post encrypted and only readable with
                NFT membership token holder.
              </Text>
            </Box>
            <hr />
            <Box textAlign={"center"}>
              <Button
                onClick={direct2UserPage}
                width={{ xs: "full", md: "full" }}
              >
                Connect With Your Blog
              </Button>
            </Box>
          </Stack>

          <div style={styles.describe}>
            <Stack>
              <Text variant="large" transform="capitalize">
                How Seal Work
              </Text>
              <Text>
                Seal is a place for blogger to create a new way to connect with
                their readers. Blogging as before, Earning with crypto, Without
                moving your original blog home.
                <br />
                <br />
                By using Seal, you can easily and cheaply deploy an{" "}
                <a href="https://eips.ethereum.org/EIPS/eip-721">
                  ERC721 token
                </a>
                (aka. NFT) on EVM-compatible{" "}
                <a href="https://ethereum.org/en/developers/docs/scaling/#layer-2-scaling">
                  Layer2 chain
                </a>
                . This NFT works as an instant pay wall, where you can seal some
                content (encrypted) in your post, in order to unseal the premium
                content(decrypt), your reader must buy one of this NFT and
                became a token holder.
              </Text>
              <Text>
                The pay wall has some advantage: (1. You gain crypto money via
                ERC721 smart-contract, no one can touch your fund. (2. You can
                keep blogging free content as you want just like before. When
                you want to write some premium content, the encryption is also
                very flexible, you can even encrypt one single word in your
                whole post, it doesn't have any limit. (3. It is easy to setup.
                just insert one javascript code into your blog html page, it's
                done! (we also support third party blog platform if you don't
                control the source code of you blog. See below.) (4. The token
                is not only a pay wall, you can use it as an fan level
                badge/membership token and anything you can do with NFT, it all
                depends on your imagination! Thus it is an new connection
                between bloggers and readers.
              </Text>
              <Text variant="large" transform="capitalize">
                Get Started
              </Text>
              <Text variant="large" transform="capitalize">
                (A. self-hosted blog
              </Text>
              <Text>
                1. Deploy an NFT via Seal <br />
                2. Insert one line javascript code into your blog page <br />
                3. Covert your encrypt content via Seal online editor <br />
                4. Paste the converted content to your blog and publish it,
                done! <br />
                <br />
                In this way, everything all happen in your own blog page.
              </Text>
              <Text variant="large" transform="capitalize">
                (B. third party blog platform
              </Text>
              <Text>
                1. Deploy an NFT via Seal <br />
                2. Covert your encrypt content via Seal online editor <br />
                3. Paste the converted content to your blog and publish it,
                done! <br />
                <br />
                In this way, the decryption process needs to redirect your
                reader to Seal official home page.
              </Text>
              <Text variant="large" transform="capitalize">
                road map
              </Text>
              <Text>
                Seal is now an side project. Currently we use centralize way to
                store your encrypt key for better UX and shortage developing
                workforce. After more people use and test Seal, we will keep use
                tech like <a href="https://gun.eco/">Gundb.js</a> to
                decentralize Seal and make it an complete Web3 project without
                relying on any centralize server.
              </Text>
              <Text>
                Other features incoming:
                <br />
                <br /> - Blog post prove with author's signature.
                <br /> - More flexible NFT token price setting.
                <br /> - More extendable NFT token to enable more use cases
              </Text>
              <Text variant="large" transform="capitalize">
                Acknowledgements
              </Text>
              <Text>
                Inspired by <a href="https://mask.io/">Mask Network</a>
              </Text>
              <hr />
              <Text transform="capitalize">
                <a href="">twitter</a> <a href="">github</a>{" "}
                <a href="">discord</a>{" "}
              </Text>
            </Stack>
          </div>
        </Grid>
      </Grid>
    </div>
  );
}
