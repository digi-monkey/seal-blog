import axios from "axios";
import { Base64Str, HexStr } from "./types";
const { version } = require("../package.json");

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
  params?: Params,
  type?: HttpProtocolMethod
) => Promise<any>;

export interface Params {
  [key: string]: any;
}

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
      _params: Params = {},
      type: HttpProtocolMethod = HttpProtocolMethod.get,
      cfg: {} = {}
    ) => {
      const baseUrl = this.url;
      const params = { ..._params, version };
      let axiosRes;
      switch (type) {
        case HttpProtocolMethod.get:
          axiosRes = await axios.get(`${baseUrl}/${method}`, {
            params,
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

  async addPost(
    account: HexStr,
    rawPost: Base64Str,
    key: string,
    iv: string,
    postId: HexStr,
    chainId: HexStr
  ) {
    return await this.httpRequest(
      "add_post",
      {
        account,
        raw_post: rawPost,
        key,
        iv,
        post_id: postId,
        chain_id: chainId,
      },
      HttpProtocolMethod.post
    );
  }

  async getPost(postId: string) {
    return await this.httpRequest(
      "get_post",
      {
        post_id: postId,
      },
      HttpProtocolMethod.get
    );
  }

  async getEnvelopByPostIdAndPk(postId: string, pk: string) {
    return await this.httpRequest(
      "get_envelop_by_post_id_and_pk",
      {
        post_id: postId,
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

  async getContractOwner(contractAddr: string) {
    return await this.httpRequest(
      "get_contract_owner",
      {
        contract_address: contractAddr,
      },
      HttpProtocolMethod.get
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

  async getContractAddressByPostId(postId: string) {
    return await this.httpRequest(
      "get_contract_address_by_post_id",
      {
        post_id: postId,
      },
      HttpProtocolMethod.get
    );
  }

  async getPostIds(account: string) {
    return await this.httpRequest(
      "get_post_ids",
      {
        account,
      },
      HttpProtocolMethod.get
    );
  }

  async getEnvelopsByPostId(postId: string) {
    return await this.httpRequest(
      "get_envelops_by_post_id",
      {
        post_id: postId,
      },
      HttpProtocolMethod.get
    );
  }

  async generateEnvelops(postId: string) {
    return await this.httpRequest(
      "generate_envelops",
      {
        post_id: postId,
      },
      HttpProtocolMethod.get
    );
  }

  async getKeyEnvelopByPostId(postId: string) {
    return await this.httpRequest(
      "get_key_envelop_by_post_id",
      {
        post_id: postId,
      },
      HttpProtocolMethod.get
    );
  }
}
