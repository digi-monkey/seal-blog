import { Api } from "./api";
import { decrypt } from "./crypto";
import {
  SEAL_CONTENT_MATCH_REGEX,
  SPLITTER_REGEX,
  UNSEAL_SPLITTER_TEXT,
  SPLITTER_HTML_REGEX,
} from "./regex";
import { parsePostId } from "./seal";
import { requestEncryptionPublicKeyFromMetamask } from "./web3";

declare global {
  interface Window {
    ethereum: any;
  }
}

export function getPostId() {
  const links = document.links;
  for (let i = 0; i < links.length; i++) {
    if (links.item(i)?.href.includes("postId=")) {
      return links.item(i)?.href.split("postId=").at(-1);
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
  postId: string,
  pk: string,
  api: Api,
  clientRpc: string
) {
  let envelop;
  try {
    envelop = (await api.getEnvelopByPostIdAndPk(postId, pk)).envelop;
    console.log("envelop:", envelop);
  } catch (error: any) {
    const confirm = window.confirm(
      "Decrypt article failed.\n\nErr: " +
        error.message +
        "\n\nAre you a subscriber? Click Ok to learn How to subscribe the author's NFT readership token!"
    );
    if (!confirm) return;

    const contract = parsePostId(postId);
    return (window.location.href =
      clientRpc + "/subscribe?contract=" + contract.contractAddress);
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

export function replaceEncryptText(decryptText: string) {
  const s = document.body.innerText.match(SEAL_CONTENT_MATCH_REGEX);
  if (s == null) {
    throw new Error("no match content!");
  }

  if (s.length > 0) {
    const encryptedText = s[0].split(SPLITTER_REGEX)[1];

    const nodes: ChildNode[] = [];

    document.body.childNodes.forEach((n) => {
      const nds = findNodesWithSubText(n, encryptedText);
      if (nds.length > 0) {
        nodes.push(...nds);
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
  }
}

export function replaceSealSplitter() {
  const originNode = findFirstSealSplitterNode();
  if (originNode == null) throw new Error("no match splitter!");

  document.body.childNodes.forEach((n) => {
    const nodes = findSpecificNode(n, originNode);
    if (nodes.length > 0) {
      nodes.forEach((n) => (n.textContent = UNSEAL_SPLITTER_TEXT));
    }
  });
}

export function addDecryptButton(rpc: string, clientRpc: string) {
  let isSuccess = false;
  const originNode = findFirstSealSplitterNode();
  if (originNode == null) {
    console.log("no splitter match, abort adding decrypt button");
    return isSuccess;
  }

  document.body.childNodes.forEach((n) => {
    const nodes = findSpecificNode(n, originNode);
    if (nodes.length > 0) {
      const clickHandler = function (e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        unseal(rpc, clientRpc);
        return false;
      };

      nodes.forEach((n) => {
        const aLink = findNodesWithSubText(n, "here")[0];
        if (aLink == null || aLink.parentElement == null) {
          return console.log("no here text found");
        }

        aLink.parentElement.addEventListener("click", clickHandler, {
          once: true,
        });

        isSuccess = true;
      });
    }
  });

  return isSuccess;
}

export function findFirstSealSplitterNode() {
  const match = document.body.innerHTML.match(SPLITTER_HTML_REGEX);

  if (!match || match.length === 0) {
    return undefined;
  }

  const nodeHtmlStr = match[0].trim();
  const firstNode = document
    .createRange()
    .createContextualFragment(nodeHtmlStr)
    .cloneNode(true).firstChild!;
  return firstNode;
}

export function findNodesWithSubText(
  n: ChildNode,
  targetText: string,
  result: ChildNode[] = []
): ChildNode[] {
  if (n.nodeType === Node.TEXT_NODE) {
    if (
      n.nodeValue !== null &&
      n.nodeValue.trim().length != 0 &&
      targetText.includes(n.nodeValue)
    ) {
      result.push(n);
    }
  }

  for (let i = 0; i < n.childNodes.length; i++) {
    findNodesWithSubText(n.childNodes.item(i), targetText, result);
  }

  return result;
}

export function findSpecificNode(
  n: ChildNode,
  targetNode: Node,
  result: ChildNode[] = []
): ChildNode[] {
  if (n.isEqualNode(targetNode)) {
    result.push(n);
  }

  for (let i = 0; i < n.childNodes.length; i++) {
    findSpecificNode(n.childNodes.item(i), targetNode, result);
  }

  return result;
}

// rpc: api-server rpc
// clientRpc: client ui rpc
export async function unseal(rpc: string, clientRpc: string) {
  if (document.readyState != "complete") {
    return alert("page not load yet, please wait.");
  }

  const s = getEncryptedContent();
  const { account, pk } = await getAccountAndPk();
  if (account == null || pk == null) {
    throw new Error("account == null || pk == null");
  }

  const postId = getPostId();
  if (postId == null) {
    throw new Error("postId not found");
  }

  const api = new Api(rpc);
  const decryptText = await decryptArticle(
    s,
    account,
    postId,
    pk,
    api,
    clientRpc
  );
  if (decryptText != null) {
    replaceEncryptText(decryptText);
  }
}

export async function detectHtmlToAddButton(
  rpc: string,
  maxRetry: number,
  clientRpc: string
) {
  try {
    if (window) {
      let isSuccess = false;
      let retryCount = 0;

      const t = setInterval(() => {
        isSuccess = addDecryptButton(rpc, clientRpc);
        retryCount++;
        console.log(`[unseal.js] retry ${retryCount} times..`);

        if (retryCount > maxRetry) {
          clearInterval(t);
        }

        if (isSuccess) {
          clearInterval(t);
        }
      }, 5000);
    }
  } catch (error) {
    console.log("[unseal.js] no window detect.");
  }
}
