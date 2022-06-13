const defaultBaseUrl = "https://api.coingecko.com/api/v3";
const ckbUsdPriceSubUrl = "/simple/price?ids=nervos-network&vs_currencies=usd";

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

  async ckbUsd(): Promise<string> {
    const res = await this.sendRequest(this.baseUrl + ckbUsdPriceSubUrl);
    const resObj = JSON.parse(res);
    return resObj["nervos-network"].usd;
  }
}
