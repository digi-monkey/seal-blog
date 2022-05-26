import axios from "axios";

export const DEFAULT_API_URL = "http://localhost:9112";

//axios.defaults.withCredentials = true;
export type ApiHttpResponse = {
  status: "ok" | "failed";
  data?: any;
  error?: string;
};
export enum HttpProtocolMethod {
  "get",
  "post",
  "option",
}
export type HttpRequest = (
  method: string,
  params?: object,
  type?: HttpProtocolMethod
) => Promise<any>;

export class base {
  url: string;
  httpRequest: HttpRequest;

  constructor(baseUrl: string, httpRequest?: HttpRequest) {
    this.url = baseUrl;
    this.httpRequest = httpRequest || this.newHttpRequest();
  }

  newHttpRequest() {
    return async (
      method: string,
      params: Object = {},
      type: HttpProtocolMethod = HttpProtocolMethod.get,
      cfg: {} = {}
    ) => {
      const baseUrl = this.url;
      let axiosRes;
      switch (type) {
        case HttpProtocolMethod.get:
          axiosRes = await axios.get(`${baseUrl}/${method}`, {
            params: params,
            ...cfg,
          });
          break;

        case HttpProtocolMethod.post:
          axiosRes = await axios.post(
            `${baseUrl}/${method}`,
            {
              data: params,
            },
            cfg
          );
          break;

        default:
          throw new Error(`unsupported HttpRequestType, ${type}`);
      }
      if (axiosRes.status !== 200) {
        throw new Error(`http request fails, ${axiosRes}`);
      }

      const response = axiosRes.data;
      return response;
    };
  }

  async ping() {
    return await this.httpRequest("ping");
  }

  setUrl(newUrl: string) {
    if (newUrl.startsWith("http")) {
      this.url = newUrl;
    } else {
      this.url = `http://${newUrl}`;
    }
  }

  getUrl() {
    return this.url;
  }
}

export class Api extends base {
  constructor(url?: string, httpRequest?: HttpRequest) {
    const newHttpRequest = async (
      method: string,
      params: Object = {},
      type: HttpProtocolMethod = HttpProtocolMethod.get
    ) => {
      const response: ApiHttpResponse = await super.newHttpRequest()(
        method,
        params,
        type
      );
      if (response.status === "failed")
        throw new Error(`httpRequest server error: ${response.error}`);
      return response.data;
    };
    super(url || DEFAULT_API_URL, httpRequest || newHttpRequest);
  }

  async getAesKeyDoubleEnvelop(token_id: string, req_id: string) {
    return (await this.httpRequest("get_aes_key_double_envelop_by_public_key", {
      token_id: token_id,
      id: req_id,
    })) as string;
  }

  async loadArticleList() {
    return (await this.httpRequest("load_article_list")) as string[];
  }

  async getEncryptArticleRawData(txHash: string): Promise<string | undefined> {
    return await this.httpRequest("get_encrypt_article_raw_data", {
      tx_hash: txHash,
    });
  }

  async decryptArticle(AESKey: string, article: string): Promise<string> {
    return await this.httpRequest(
      "decrypt_article_with_key",
      {
        key: AESKey,
        data: article,
      },
      HttpProtocolMethod.post
    );
  }

  async doubleDecryptArticle(
    AESKey: string, // the aes key here is still encrypted hence double decrypt from server
    article: string,
    reqId: string
  ): Promise<string> {
    return await this.httpRequest(
      "double_decrypt_article_with_key",
      {
        key: AESKey,
        data: article,
        id: reqId,
      },
      HttpProtocolMethod.post
    );
  }

  async addPost(
    account: string,
    rawPost: string,
    key: string,
    iv: string,
    hashId: string
  ) {
    return await this.httpRequest(
      "add_post",
      {
        account,
        raw_post: rawPost,
        key,
        iv,
        hash_id: hashId,
      },
      HttpProtocolMethod.post
    );
  }

  async getPost(hashId: string) {
    return await this.httpRequest(
      "get_post",
      {
        hash_id: hashId,
      },
      HttpProtocolMethod.get
    );
  }

  async getEnvelopByHashIdAndPk(hashId: string, pk: string) {
    return await this.httpRequest(
      "get_envelop_by_hash_id_and_pk",
      {
        hash_id: hashId,
        pk,
      },
      HttpProtocolMethod.get
    );
  }

  async bindContract(txHash: string) {
    return await this.httpRequest(
      "bind_contract",
      {
        tx_hash: txHash,
      },
      HttpProtocolMethod.post
    );
  }

  async getContractAddress(account: string) {
    return await this.httpRequest(
      "get_contract_address",
      {
        account,
      },
      HttpProtocolMethod.get
    );
  }

  async getContractAddressByHashId(hashId: string) {
    return await this.httpRequest(
      "get_contract_address_by_hash_id",
      {
        hash_id: hashId,
      },
      HttpProtocolMethod.get
    );
  }

  async getHashIds(account: string) {
    return await this.httpRequest(
      "get_hash_ids",
      {
        account,
      },
      HttpProtocolMethod.get
    );
  }
}
