import { hash, encrypt } from "./crypto";
import { formatGibberish } from "./helper";
import {
  WRITE_SEAL_SPLITTER,
  getFullMatchSealedSplitter,
  SEALED_SPLITTER_REGEX,
} from "./regex";
import { DecimalStr, HexStr } from "./types";
const { version } = require("../package.json");

export function sealPost(
  post: string,
  key: string,
  iv: string,
  decryptUrl: string,
  chainId: HexStr,
  contractAddress: HexStr
) {
  const s = post.split(WRITE_SEAL_SPLITTER);
  if (s.length !== 2) {
    throw new Error("invalid post text!");
  }
  const encryptText = encrypt(s[1], key, iv);
  const formatEncryptedText = formatGibberish(encryptText);
  const hashId = hash(formatEncryptedText);
  const postId = calcPostId(hashId, chainId, contractAddress);
  const splitter = getFullMatchSealedSplitter(postId, decryptUrl, version);
  return [postId, s[0] + splitter + formatEncryptedText + splitter];
}

export function parseRawPost(rawPost: string) {
  const s = rawPost
    .split(SEALED_SPLITTER_REGEX)
    .filter((str) => str.replace(/\s/g, "").length !== 0);
  if (s.length < 2) {
    throw new Error("invalid rawPost!");
  }
  return {
    header: s[0],
    encryptText: s[1].replace(/\s/g, ""),
    tail: s.length > 2 ? s[2] : "",
  };
}

export function parseHashId(rawPost: string) {
  const { encryptText } = parseRawPost(rawPost);
  const formatEncryptedText = formatGibberish(encryptText);
  const hashId = hash(formatEncryptedText);
  return hashId;
}

// | 8 bytes | 20 bytes | 20 bytes |
// | chainId | address  | hashId   |
export function calcPostId(
  hashId: HexStr,
  chainId: HexStr,
  contractAddress: HexStr
) {
  if (contractAddress.length !== 42) {
    throw new Error(
      `invalid contract address length, expect 20 bytes, got ${
        contractAddress.slice(2).length / 2
      } bytes`
    );
  }

  return (
    "0x" +
    chainId.slice(2).padStart(16, "0") +
    contractAddress.slice(2).toLocaleLowerCase() +
    hashId.slice(2)
  );
}

export function parsePostId(postId: HexStr) {
  if (postId.slice(2).length / 2 !== 48) {
    throw new Error(
      `invalid post id length, expect 48 bytes, got ${
        postId.slice(2).length / 2
      } bytes`
    );
  }

  const chainId: DecimalStr = BigInt(
    "0x" + postId.slice(2).slice(0, 16)
  ).toString();
  const contractAddress = "0x" + postId.slice(2).slice(16, 56);
  const hashId = "0x" + postId.slice(56);
  return {
    chainId,
    contractAddress,
    hashId,
  };
}
