import { encrypt, hash } from "./crypto";
const { version } = require("../package.json");

export enum BlockchainNetwork {
  devnet = 0,
  testnet = 1,
  mainnet = 2,
}

export const WRITE_SEAL_SPLITTER = "---seal---"; // writer use this splitter to denote which content he/she wants to seal

export const SEALED_SPLITTER_REGEX =
  /(\s)+······click \[here(.)+to read encrypted content. Power By \[SealBlog\]\([^·]+·······(\s)+/g;

export function getFullMatchSealedSplitter(
  hashId: string,
  decryptUrl: string,
  version: string = "v0.1.0"
) {
  return `\n\n······click [here](${decryptUrl}?version=${version}&hashId=${hashId}) to read encrypted content. Power By [SealBlog]()·······\n\n`;
}

export function sealPost(
  post: string,
  key: string,
  iv: string,
  decryptUrl: string
) {
  const s = post.split(WRITE_SEAL_SPLITTER);
  if (s.length !== 2) {
    throw new Error("invalid post text!");
  }
  const encryptText = encrypt(s[1], key, iv);
  const formatEncryptedText = formatGibberish(encryptText);
  const hashId = hash(formatEncryptedText);
  const splitter = getFullMatchSealedSplitter(hashId, decryptUrl, version);
  return [hashId, s[0] + splitter + formatEncryptedText + splitter];
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

export async function parseHashId(rawPost: string) {
  const { encryptText } = parseRawPost(rawPost);
  const formatEncryptedText = formatGibberish(encryptText);
  const hashId = await hash(formatEncryptedText);
  return hashId;
}

// format encrypted text, make it looks like gibberish paragraphs
export function formatGibberish(encryptedText: string) {
  const encrypt_words = encryptedText.match(/.{1,3}/g);
  let paragraphs = [];
  let size_of_each_paragraph = 80;

  for (let i = 0; i < encrypt_words!.length; i += size_of_each_paragraph) {
    paragraphs.push(encrypt_words!.slice(i, i + size_of_each_paragraph));
  }

  return paragraphs.map((p) => p.join(" ")).join("\n\n");
}
