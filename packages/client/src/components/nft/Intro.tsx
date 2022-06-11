import React, { useEffect, useState } from "react";
import { Heading, Text, Box, Stack } from "degen";
import { avatar } from "../../api/nft";
import { Network } from "../metamask/network";

const styles = {
  nftImage: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    border: "4px solid black",
  },
  qaWrapper: {
    maxWidth: "700px",
  },
};

export function Intro() {
  const [nftImage, setNftImage] = useState<string>();

  useEffect(() => {
    genImg();
  }, []);

  const genImg = async () => {
    const svg = await avatar.random();
    setNftImage(svg);
  };
  return (
    <Stack align={"center"}>
      <header style={{ textAlign: "center" }} className="App-header">
        <Box margin={"10"}>
          <a href="/">
            <img
              style={styles.nftImage}
              src={`data:image/svg+xml;utf8,${encodeURIComponent(nftImage!)}`}
              alt="nft avatar"
            />
          </a>
        </Box>
        <Box margin={"3"}>
          <Heading>NFT Readership Token</Heading>
        </Box>
        <Box
          color={"black"}
          alignItems={"center"}
          borderWidth={"1"}
          margin={"3"}
          padding={"4"}
          borderColor={"black"}
        >
          <Text size={"base"}>
            An ERC721 NFT represent blog reading membership on Godwoken
          </Text>
        </Box>

        <Box margin={"5"}></Box>
        <Box margin={"2"} width={"fit"}>
          <Heading>How It Works?</Heading>
          <div style={styles.qaWrapper}>
            <Text size={"base"} align={"left"}>
              <ul>
                <li>
                  1. Reader must buy one or more NFT to access the blog for
                  reading
                </li>
                <li>
                  2. One NFT token contains one encryption public key, blog
                  article will encrypt the content to the encryption public key
                  so that the owner of NFT can decrypt and read article.
                </li>
                <li>
                  3. You can only set encryption public key if you are the owner
                  of that NFT token.{" "}
                </li>
                <li>
                  4. Bonus: when you buy NFT token, you might mint a unique
                  avatar as well!
                </li>
              </ul>
            </Text>
            <Network></Network>
          </div>
        </Box>
      </header>
    </Stack>
  );
}
