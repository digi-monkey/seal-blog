import {
  Collection,
  FindOptions,
  Document,
  Filter,
  Sort,
  OptionalUnlessRequiredId,
  InsertOneOptions,
} from "mongodb";
import { Contracts, Database, Envelop, Key, Posts, RawPost } from "./mongo";

const defaultDbSortOpt: Sort = { _id: "desc" };

const DefaultQueryLimit = 100000;

export enum RequireQueryResult {
  canBeNull,
  canNotBeNull,
}

export class Query {
  private database: Database;

  constructor(db: Database) {
    this.database = db;
  }

  private async find<T extends Document>(
    collection: Collection<T>,
    query: Filter<T> = {},
    findOpt: FindOptions<T> = {},
    limit: number = DefaultQueryLimit,
    isNullable: RequireQueryResult = RequireQueryResult.canBeNull,
    sort: Sort = defaultDbSortOpt
  ) {
    const resCursor = await collection
      .find(query, findOpt)
      .sort(sort)
      .limit(limit);
    const result = await resCursor.toArray();
    if (isNullable === RequireQueryResult.canNotBeNull && result.length === 0) {
      throw new Error(`find result is null while require is nullable`);
    }

    return result;
  }

  private async findFirstOne<T extends Document>(
    collection: Collection<T>,
    query: Filter<T> = {},
    findOpt: FindOptions<T> = {},
    limit: number = DefaultQueryLimit,
    isNullable: RequireQueryResult = RequireQueryResult.canBeNull,
    sort: Sort = defaultDbSortOpt
  ) {
    const res = await this.find(
      collection,
      query,
      findOpt,
      limit,
      isNullable,
      sort
    );
    console.log(res);
    return res.at(0);
  }

  private async insertOne<T extends Document>(
    collection: Collection<T>,
    data: OptionalUnlessRequiredId<T>,
    opt: InsertOneOptions = {}
  ) {
    const res = await collection.insertOne(data, opt);
    if (!res.acknowledged) {
      throw new Error(`insertOne failed. data: ${JSON.stringify(data)}`);
    }
    return res;
  }

  private async insertMany<T extends Document>(
    collection: Collection<T>,
    data: OptionalUnlessRequiredId<T>[],
    opt: InsertOneOptions = {}
  ) {
    const res = await collection.insertMany(data, opt);
    if (!res.acknowledged) {
      throw new Error(`insertMany failed. data: ${JSON.stringify(data)}`);
    }
    return res;
  }

  // public methods
  async getContractByAccount(account: string) {
    return await this.findFirstOne(this.database.contracts(), {
      account,
    });
  }

  async getContractByPostId(postId: string) {
    return await this.findFirstOne(this.database.contracts(), {
      postId: postId,
    });
  }

  async getEnvelopByPostIdAndPk(postId: string, pk: string) {
    return await this.findFirstOne(this.database.envelops(), {
      postId: postId,
      pk,
    });
  }

  async getRawPostByPostId(postId: string) {
    return await this.findFirstOne(this.database.rawPosts(), {
      postId: postId,
    });
  }

  async getPostByPostId(postId: string) {
    return await this.findFirstOne(this.database.posts(), {
      postId: postId,
    });
  }

  async getPosts(contractAddress: string) {
    return await this.find(this.database.posts(), {
      contractAddress,
    });
  }

  async getPostIdsByAccount(account: string) {
    const contract = await this.getContractByAccount(account);
    if (contract == null) {
      return undefined;
    }

    return await this.getPosts(contract.contractAddress);
  }

  async getKeyByPostId(postId: string) {
    return await this.findFirstOne(this.database.keys(), { postId: postId });
  }

  async insertContract(data: OptionalUnlessRequiredId<Contracts>) {
    return await this.insertOne(this.database.contracts(), data);
  }

  async insertKey(data: OptionalUnlessRequiredId<Key>) {
    return await this.insertOne(this.database.keys(), data);
  }

  async insertPost(data: OptionalUnlessRequiredId<Posts>) {
    return await this.insertOne(this.database.posts(), data);
  }

  async insertRawPost(data: OptionalUnlessRequiredId<RawPost>) {
    return await this.insertOne(this.database.rawPosts(), data);
  }

  async insertEnvelops(data: OptionalUnlessRequiredId<Envelop>[]) {
    return await this.insertMany(this.database.envelops(), data);
  }
}
