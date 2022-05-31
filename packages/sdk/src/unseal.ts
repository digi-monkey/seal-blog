import { Api } from "./api";
import { decrypt } from "./crypto";

const SEAL_CONTENT_MATCH_REGEX =
  /(\s)+······click here(.)+to read encrypted content. Power By SealBlog(.)+(\s)+[\s\S]+Power By SealBlog·······/;

const SPLITTER_REGEX =
  "\n\n······click here to read encrypted content. Power By SealBlog·······";

const SPLITTER_HTML_REGEX =
  /\<(.)+\>······click(.)+unseal?(.)+hashId=0x(.)+to read encrypted content. Power By (.)+SealBlog<\/a>·······\<\/[a-zA-Z0-9]+\>/;

const UNSEAL_SPLITTER_TEXT = "~~~~~~~~~~~ unseal ~~~~~~~~~~~";

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

    const nodes: ChildNode[] = [];

    document.body.childNodes.forEach((n) => {
      const node = findNodesWithSubText(n, encryptedText);
      if (node != undefined) {
        nodes.push(node);
      }
    });

    console.log(nodes);
    // encrypt text
    {
      if (nodes.length === 0) {
        return alert("no nodes!");
      }
      const firstParent = nodes[0].parentNode;
      const newNode = document.createElement("p");
      newNode.innerText = decryptText;
      firstParent?.replaceChild(newNode, nodes[0]);

      nodes.forEach((n, index) => {
        if (index !== 0) {
          n.parentNode?.replaceChild(document.createElement("p"), n);
        }
      });

      // remove extra br
      // todo: side effects
      const pList = document.getElementsByTagName("p");
      for (let i = 0; i < pList.length; i++) {
        pList[i].innerHTML = pList[i].innerHTML.replace("<br>", "");
        pList[i].innerHTML = pList[i].innerHTML.replace("<br/>", "");
      }
    }

    // splitter
    replaceSealSplitter();
    replaceSealSplitter();
  }
}

export function replaceSealSplitter() {
  const match = document.body.innerHTML.match(SPLITTER_HTML_REGEX);
  if (!match || match.length === 0) {
    throw new Error("no match splitter");
  }

  const nodeHtmlStr = match[0].trim();
  const originNode = document
    .createRange()
    .createContextualFragment(nodeHtmlStr)
    .cloneNode(true).firstChild!;

  document.body.childNodes.forEach((n) => {
    const s = findSpecificNode(n, originNode);
    if (s != null) {
      s.textContent = UNSEAL_SPLITTER_TEXT;
    }
  });
}

export function findNodesWithSubText(
  n: ChildNode,
  targetText: string
): ChildNode | undefined {
  if (n.nodeType === Node.TEXT_NODE) {
    if (
      n.nodeValue !== null &&
      n.nodeValue.trim().length != 0 &&
      targetText.includes(n.nodeValue)
    ) {
      return n;
    }
  }

  for (let i = 0; i < n.childNodes.length; i++) {
    const r = findNodesWithSubText(n.childNodes.item(i), targetText);
    if (r !== undefined) {
      return r;
    } else {
      continue;
    }
  }
}

export function findSpecificNode(
  n: ChildNode,
  targetNode: Node
): ChildNode | undefined {
  //console.log("n", n, "targetNode", targetNode, "Result", n.isEqualNode(targetNode));
  if (n.isEqualNode(targetNode)) {
    return n;
  }

  for (let i = 0; i < n.childNodes.length; i++) {
    const r = findSpecificNode(n.childNodes.item(i), targetNode);
    if (r !== undefined) {
      return r;
    } else {
      continue;
    }
  }
}

export async function main() {
  if (document.readyState != "complete") {
    return alert("page not load yet, please wait.");
  }

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
}
