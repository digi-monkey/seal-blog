const defaultBaseUrl = "https://api.coingecko.com/api/v3";

export class Price {
  baseUrl: string;
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || defaultBaseUrl;
  }

  private async sendRequest(url: string) {
    let response = await fetch(url);
    if (response.status === 200) {
      let data = await response.text();
      return data;
    } else {
      throw new Error("fetch failed, error code " + response.status);
    }
  }

  async tokenUsd(tokenId: string) {
    const subUrl = `/simple/price?ids=${tokenId}&vs_currencies=usd`;
    const res = await this.sendRequest(this.baseUrl + subUrl);
    const resObj = JSON.parse(res);
    if (!("usd" in resObj[tokenId])) {
      throw new Error(
        `request to ${this.baseUrl + subUrl} error, result: ${res}`
      );
    }
    return resObj[tokenId].usd;
  }
}
