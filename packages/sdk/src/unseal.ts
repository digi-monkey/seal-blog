import { Api } from "./api";
import { decrypt } from "./crypto";

const SEAL_CONTENT_MATCH_REGEX =
  /(\s)+······click here(.)+to read encrypted content. Power By SealBlog(.)+(\s)+[\s\S]+Power By SealBlog·······/;

const SPLITTER_REGEX =
  "\n\n······click here to read encrypted content. Power By SealBlog·······";

declare global {
  interface Window {
    ethereum: any;
  }
}

export function getHashId() {
  const links = document.links;
  for (let i = 0; i < links.length; i++) {
    if (links.item(i)?.href.includes("hashId=")) {
      return links.item(i)?.href.split("hashId=").at(-1);
    }
  }

  return null;
}

export function getEncryptedContent() {
  const s = document.body.innerText.match(SEAL_CONTENT_MATCH_REGEX);
  if (s == null) {
    throw new Error("no match content!");
  }

  if (s.length > 0) {
    return s[0].split(SPLITTER_REGEX)[1].replace(/\s/g, "");
  }

  throw new Error("no match content!");
}

export async function decryptArticle(
  encryptedText: string,
  account: string,
  hashId: string,
  pk: string,
  api: Api
) {
  let envelop;
  try {
    envelop = (await api.getEnvelopByHashIdAndPk(hashId, pk)).envelop;
    console.log(envelop);
  } catch (error: any) {
    alert(
      "sorry, you are not allow to read this article. err: " + error.message
    );
    return;
  }

  if (envelop != null) {
    const s = await decryptAESKey(envelop, account);
    const aesKey = s.slice(0, 32);
    const iv = s.slice(32);
    console.log("envelop decrypted =>", aesKey, iv);
    const text = decrypt(encryptedText, aesKey, iv);
    console.log("decrypt ==>", text);
    return text;
  }

  return null;
}

export async function decryptAESKey(envelop: string, account: string) {
  const decryptedMessage = await window.ethereum.request({
    method: "eth_decrypt",
    params: [envelop, account],
  });
  return decryptedMessage;
}

export async function getAccountAndPk() {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = accounts[0] as string;
  const encryptionPublicKey =
    localStorage.getItem(account) ||
    (await requestEncryptionPublicKeyFromMetamask(account));

  return { account, pk: encryptionPublicKey };
}

export async function requestEncryptionPublicKeyFromMetamask(account: string) {
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
}

export function replaceEncryptText(decryptText: string) {
  const s = document.body.innerText.match(SEAL_CONTENT_MATCH_REGEX);
  if (s == null) {
    throw new Error("no match content!");
  }

  if (s.length > 0) {
    const encryptedText = s[0].split(SPLITTER_REGEX)[1];
    document.body.innerText = document.body.innerText.replace(
      encryptedText,
      decryptText
    );
  }
}

export async function main() {
  window.addEventListener("load", async function () {
    const s = getEncryptedContent();
    console.log(s);
    const { account, pk } = await getAccountAndPk();
    if (account == null || pk == null) {
      throw new Error("account == null || pk == null");
    }

    const hashId = getHashId();
    if (hashId == null) {
      throw new Error("hashId not found");
    }

    const api = new Api();
    const decryptText = await decryptArticle(s, account, hashId, pk, api);
    if (decryptText != null) {
      replaceEncryptText(decryptText);
    }
  });
}
