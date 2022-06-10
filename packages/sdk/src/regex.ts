import { OFFICIAL_SEAL_HOME } from "./const";
const { version: defaultVersion } = require("../package.json");

export const WRITE_SEAL_SPLITTER = "---seal---"; // writer use this splitter to denote which content he/she wants to seal

export const SEALED_SPLITTER_REGEX =
  /(\s)+······Click \[here(.)+to read encrypted content. Power By \[SealBlog\]\([^·]+·······(\s)+/g;

export const SEAL_CONTENT_MATCH_REGEX =
  /(\s)*······Click[\s]here(.)+to[\s]read[\s]encrypted[\s]content.[\s]Power[\s]By[\s]SealBlog(.)+(\s)+[\s\S]+Power[\s]By[\s]SealBlog·······/;

export const SPLITTER_REGEX =
  /\n\n······Click[\s]here[\s]to[\s]read[\s]encrypted[\s]content.[\s]Power[\s]By[\s]SealBlog·······/;

export const SPLITTER_HTML_REGEX =
  /<[^>]+>······Click(.)+unseal?(.)+postId=0x(.)+to[\s]read[\s]encrypted[\s]content.[\s]Power[\s]By(.)+SealBlog<\/a>·······\<\/[a-zA-Z0-9]+\>/;

export const UNSEAL_SPLITTER_TEXT = "~~~~~~~~~~~ / ᵒᴥᵒᶅ ~~~~~~~~~~~";

export function getFullMatchSealedSplitter(
  postId: string,
  decryptUrl: string,
  version: string = defaultVersion
) {
  return `\n\n······Click [here](${decryptUrl}?version=${version}&postId=${postId}) to read encrypted content. Power By [SealBlog](${OFFICIAL_SEAL_HOME})·······\n\n`;
}
