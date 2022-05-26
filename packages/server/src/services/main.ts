import { Service } from "./base";
import { allowType, HttpProtocolMethod } from "../http-server";
import { logger } from "../logger";
import { Contracts, database, Envelop, Key, Posts, RawPost } from "../db";
import { parseHashId, encryptAesKeyAndIv } from "@seal-blog/sdk";
import { provider, ZERO_ADDRESS } from "../web3";
import CONTRACT_ARTIFACTS from "../contracts/contract-artifact.json";
import { ethers } from "ethers";

const service_name = `Seal Api Server`;

export class MainService extends Service {
  constructor(name: string = service_name, req?: any, res?: any) {
    super(name, req, res);
  }

  @allowType(HttpProtocolMethod.post)
  async add_post() {
    // todo: require signature on rawPost and check it
    let rawPost = this.req.body.data.raw_post;
    let _hashId = this.req.body.data.hash_id;
    let account = this.req.body.data.account;

    // todo: maybe encrypt this to protect key and iv
    // todo: validate key/iv length
    let key = this.req.body.data.key;
    let iv = this.req.body.data.iv;

    logger.info(account, rawPost, key, _hashId);

    const contractObj = await database.contracts().findOne({ account });
    if (
      contractObj == null ||
      contractObj.account == null ||
      contractObj.contractAddress == null
    ) {
      throw new Error(`contractObj not found, account: ${account}`);
    }

    const hashId = await parseHashId(rawPost);
    if (_hashId !== hashId) {
      throw new Error(`hash id mismatch, ${_hashId}, ${hashId}`);
    }

    const keyDoc: Omit<Key, "_id"> = {
      hashId,
      key,
      iv,
    };
    const insertKeyResult = await database.keys().insertOne(keyDoc);
    if (insertKeyResult == null) {
      throw new Error("insert key failed.");
    }

    const rawPostDoc: Omit<RawPost, "_id"> = {
      hashId,
      text: rawPost,
    };
    const insertRawPostResult = await database.rawPosts().insertOne(rawPostDoc);
    if (insertRawPostResult == null) {
      throw new Error("insert raw post failed.");
    }

    const postDoc: Omit<Posts, "_id"> = {
      hashId,
      contractAddress: contractObj.contractAddress,
    };
    const insertPostResult = await database.posts().insertOne(postDoc);
    if (insertPostResult == null) {
      throw new Error("insert post failed.");
    }

    return {
      hashId,
      insertKeyResult,
      insertRawPostResult,
      insertPostResult,
    };
  }

  async get_post() {
    const hashId = this.req.query.hash_id;
    const post = await database.rawPosts().findOne({ hashId });
    if (post == null) {
      throw new Error(`post not found, hashId: ${hashId}`);
    }
    return post;
  }

  async get_envelop_by_hash_id_and_pk() {
    const hashId = this.req.query.hash_id;
    const pk = this.req.query.pk;
    const envelop = await database.envelops().findOne({ hashId, pk });
    if (envelop == null) {
      throw new Error(`envelop not found, hashId: ${hashId}, pk: ${pk}`);
    }
    return envelop;
  }

  async generate_envelops() {
    const hashId = this.req.query.hash_id;
    const account = this.req.query.account.toLowerCase();
    const keyObj = await database.keys().findOne({ hashId });
    if (keyObj == null || keyObj.key == null || keyObj.iv == null) {
      throw new Error(`key not found, hashId: ${hashId}`);
    }

    const contractObj = await database.contracts().findOne({ account });
    if (
      contractObj == null ||
      contractObj.account == null ||
      contractObj.contractAddress == null
    ) {
      throw new Error(`contractObj not found, account: ${account}`);
    }
    const accessToken = new ethers.Contract(
      contractObj.contractAddress,
      CONTRACT_ARTIFACTS.abi,
      provider
    ); //Contract.attach(contractObj.contractAddress);

    console.log("keyObj: ", keyObj);
    const key = keyObj.key;
    const iv = keyObj.iv;

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
    console.log("pks:", pks);
    const envelopPromise = pks.map(async (pk) => {
      const envel: string = await encryptAesKeyAndIv(pk, key, iv);
      const envelop: Omit<Envelop, "_id"> = {
        hashId,
        pk,
        envelop: envel,
      };
      return envelop;
    });
    const envelops = await Promise.all(envelopPromise);
    logger.debug("generated envelops", envelops);
    const res = await database.envelops().insertMany(envelops);
    if (res == null) {
      throw new Error("insert many envelops failed!");
    }

    return {
      hashId,
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
    const contractDoc: Omit<Contracts, "_id"> = {
      account,
      contractAddress,
    };
    const insertResult = await database.contracts().insertOne(contractDoc);
    if (insertResult == null) {
      throw new Error("insert contract failed.");
    }

    return insertResult;
  }

  async get_contract_address() {
    const account = this.req.query.account;
    const contractObj = await database.contracts().findOne({ account });
    if (
      contractObj == null ||
      contractObj.account == null ||
      contractObj.contractAddress == null
    ) {
      throw new Error(`contract not found, account: ${account}`);
    }

    return contractObj.contractAddress;
  }

  async get_contract_address_by_hash_id() {
    const hashId = this.req.query.hash_id;
    const postObj = await database.posts().findOne({ hashId });
    if (
      postObj == null ||
      postObj.hashId == null ||
      postObj.contractAddress == null
    ) {
      throw new Error(`contract not found, account: ${hashId}`);
    }

    return postObj.contractAddress;
  }

  async get_hash_ids() {
    const account = this.req.query.account;
    const contractObj = await database.contracts().findOne({ account });
    if (
      contractObj == null ||
      contractObj.account == null ||
      contractObj.contractAddress == null
    ) {
      throw new Error(`contract not found, account: ${account}`);
    }

    const postObj = database
      .posts()
      .find({ contractAddress: contractObj.contractAddress });
    let res = await postObj.toArray();
    res = res.map((r) => {
      r.createdTs = r._id.getTimestamp();
      return r;
    });
    console.log(res);
    return res;
  }
}
