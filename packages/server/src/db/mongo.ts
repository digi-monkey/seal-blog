import { Collection, Db, MongoClient, Document } from "mongodb";
import { logger } from "../logger";

const defaultUrl = "mongodb://localhost:27017";
const defaultDbName = "seal-blogblog";
const keysTableName = "keys";
const envelopsTableName = "envelops";
const rawPostTableName = "rawPost";
const contractsTableName = "contracts";
const postsTableName = "posts";

const _schemeValidator = {
  collMod: process.env.GAMES_COLLECTION_NAME,
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "price", "category"],
      additionalProperties: false,
      properties: {
        _id: {},
        name: {
          bsonType: "string",
          description: "'name' is required and is a string",
        },
        price: {
          bsonType: "number",
          description: "'price' is required and is a number",
        },
        category: {
          bsonType: "string",
          description: "'category' is required and is a string",
        },
      },
    },
  },
};

export interface Key extends Document {
  postId: string; // the encrypt text sha1 hash id, also work as post id to locate a raw post
  key: string;
  iv: string;
}

export interface Envelop extends Document {
  postId: string;
  pk: string;
  envelop: string;
}

export interface RawPost extends Document {
  postId: string; // also the post id
  text: string;
}

export interface Posts extends Document {
  contractAddress: string;
  postId: string;
}

export interface Contracts extends Document {
  account: string;
  contractAddress: string;
}

export class Database {
  private client: MongoClient;
  private dbName: string;

  constructor(dbName?: string, url?: string) {
    this.dbName = dbName || defaultDbName;
    this.client = new MongoClient(url || defaultUrl);
  }

  async load(): Promise<Db> {
    try {
      await this.client.connect();
      logger.info("Connected successfully to MongoDB!");
      const db = this.client.db(this.dbName);
      return db;
    } catch (error: any) {
      logger.error(error.message);
      throw error;
    }
  }

  table(name: string) {
    return this.client.db(this.dbName).collection(name);
  }

  keys(): Collection<Key> {
    return this.table(keysTableName) as any;
  }

  envelops(): Collection<Envelop> {
    return this.table(envelopsTableName) as any;
  }

  rawPosts(): Collection<RawPost> {
    return this.table(rawPostTableName) as any;
  }

  contracts(): Collection<Contracts> {
    return this.table(contractsTableName) as any;
  }

  posts(): Collection<Posts> {
    return this.table(postsTableName) as any;
  }
}
