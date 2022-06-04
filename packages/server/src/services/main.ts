import { Service } from "./base";
import { allowType, HttpProtocolMethod } from "../http-server";
import { logger } from "../logger";
import {
  Contracts,
  database,
  Envelop,
  Key,
  Posts,
  Query,
  RawPost,
} from "../db";
import {
  parseHashId,
  encryptAesKeyAndIv,
  calcPostId,
  HexStr,
  parsePostId,
} from "@seal-blog/sdk";
import { provider, ZERO_ADDRESS } from "../web3";
import CONTRACT_ARTIFACTS from "../configs/blockchain/contract-artifact.json";
import { ethers } from "ethers";

const service_name = `Seal Api Server`;

export class MainService extends Service {
  private query: Query;

  constructor(name: string = service_name, req?: any, res?: any) {
    super(name, req, res);
    this.query = new Query(database);
  }

  @allowType(HttpProtocolMethod.post)
  async add_post() {
    // todo: require signature on rawPost and check it
    const rawPost = this.req.body.data.raw_post;
    const _postId = this.req.body.data.post_id;
    const account = this.req.body.data.account;
    const chainId: HexStr = this.req.body.data.chain_id;
    // todo: maybe encrypt this to protect key and iv
    // todo: validate key/iv length
    const key = this.req.body.data.key;
    const iv = this.req.body.data.iv;

    logger.info(account, rawPost, key, _postId);

    const contractObj = await this.query.getContractByAccount(account);
    if (contractObj == null) {
      throw new Error(`contractObj not found, account: ${account}`);
    }

    const hashId = parseHashId(rawPost);
    const postId = calcPostId(hashId, chainId, contractObj.contractAddress);
    if (_postId !== postId) {
      throw new Error(`post id mismatch, ${_postId}, ${postId}`);
    }

    const keyDoc: Key = {
      postId,
      key,
      iv,
    };
    const insertKeyResult = await this.query.insertKey(keyDoc);

    const rawPostDoc: RawPost = {
      postId,
      text: rawPost,
    };
    const insertRawPostResult = await this.query.insertRawPost(rawPostDoc);

    const postDoc: Posts = {
      postId,
      contractAddress: contractObj.contractAddress,
    };
    const insertPostResult = await this.query.insertPost(postDoc);

    // generate envelops
    // todo: run in another thread
    this.req.query.post_id = postId;
    this.generate_envelops();

    return {
      postId,
      insertKeyResult,
      insertRawPostResult,
      insertPostResult,
    };
  }

  async get_post() {
    const postId = this.req.query.post_id;
    const post = await this.query.getRawPostByPostId(postId);
    if (post == null) {
      throw new Error(`post not found, hashId: ${postId}`);
    }
    return post;
  }

  async get_envelop_by_post_id_and_pk() {
    const postId = this.req.query.post_id;
    const pk = this.req.query.pk;
    const envelop = await this.query.getEnvelopByPostIdAndPk(postId, pk);
    if (envelop == null) {
      throw new Error(`envelop not found, hashId: ${postId}, pk: ${pk}`);
    }
    return envelop;
  }

  async generate_envelops() {
    const postId = this.req.query.post_id;
    const keyObj = await this.query.getKeyByPostId(postId);
    if (keyObj == null) {
      throw new Error(`key not found, hashId: ${postId}`);
    }
    logger.info("keyObj: ", keyObj);
    const key = keyObj.key;
    const iv = keyObj.iv;

    const contractAddress = parsePostId(postId).contractAddress;

    const accessToken = new ethers.Contract(
      contractAddress,
      CONTRACT_ARTIFACTS.abi,
      provider
    );

    const _filter = await accessToken.filters.Transfer(ZERO_ADDRESS);
    const filter = {
      ..._filter,
      ...{ fromBlock: "earliest", toBlock: "latest" },
    };
    const length = (await provider.getLogs(filter)).length;
    logger.info("getTotalTokenCount:" + length);
    const pks: string[] = [];
    // todo: opt
    for (let i = 0; i < length; i++) {
      const tokenId = i + 1;
      const pk = await accessToken.encryptPublicKeys(tokenId);
      pks.push(pk);
    }
    const envelopPromise = pks.map(async (pk) => {
      const _envelop: string = await encryptAesKeyAndIv(pk, key, iv);
      const envelop: Envelop = {
        postId,
        pk,
        envelop: _envelop,
      };
      return envelop;
    });
    const envelops = await Promise.all(envelopPromise);
    logger.debug("generated envelops", envelops);
    const res = await this.query.insertEnvelops(envelops);

    return {
      postId,
      insertResult: res,
    };
  }

  @allowType(HttpProtocolMethod.post)
  async bind_contract() {
    let txHash = this.req.body.data.tx_hash;
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt.status !== 1) {
      throw new Error(`tx receipt status !== 1, txHash: ${txHash}`);
    }

    const account = receipt.from.toLowerCase();
    const contractAddress = receipt.contractAddress;
    const code = await provider.getCode(contractAddress);
    // check if code is matched
    if (
      code.replace("0x", "") !==
      CONTRACT_ARTIFACTS.deployedBytecode.replace("0x", "")
    ) {
      throw new Error(
        `contract code not matched!, expect: ${CONTRACT_ARTIFACTS.deployedBytecode}, got ${code}`
      );
    }

    logger.info(account, contractAddress);
    const contractDoc: Contracts = {
      account,
      contractAddress,
    };
    const insertResult = await this.query.insertContract(contractDoc);

    return insertResult;
  }

  async get_contract_address() {
    const account = this.req.query.account;
    const contractObj = await this.query.getContractByAccount(account);
    if (contractObj == null) {
      throw new Error(`contract not found, account: ${account}`);
    }

    return contractObj.contractAddress;
  }

  async get_contract_address_by_post_id() {
    const postId = this.req.query.post_id;
    const postObj = await this.query.getPostByPostId(postId);
    if (postObj == null) {
      throw new Error(`contract not found, account: ${postId}`);
    }

    return postObj.contractAddress;
  }

  async get_post_ids() {
    const account = this.req.query.account;
    const contractObj = await this.query.getContractByAccount(account);
    if (contractObj == null) {
      throw new Error(`contract not found, account: ${account}`);
    }

    const posts = await this.query.getPosts(contractObj.contractAddress);
    const res = posts.map((r) => {
      r.createdTs = r._id.getTimestamp();
      return r;
    });
    return res;
  }
}
