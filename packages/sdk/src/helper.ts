export enum BlockchainNetwork {
  devnet = 0,
  testnet = 1,
  mainnet = 2,
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

export function normalizeUrl(url: string): string {
  if (url.length === 1) {
    throw new Error("invalid url");
  }

  return url.endsWith("/") ? normalizeUrl(url.slice(0, url.length - 1)) : url;
}
