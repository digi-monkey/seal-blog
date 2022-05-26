import { Collection, Db, MongoClient, Document, ObjectId } from "mongodb";

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

//todo: hashId should under contract name

export interface Key {
  _id: ObjectId;
  hashId: string; // the encrypt text sha1 hash id, also work as post id to locate a raw post
  key: string;
  iv: string;
}

export interface Envelop {
  _id: ObjectId;
  hashId: string;
  pk: string;
  envelop: string;
}

export interface RawPost {
  _id: ObjectId;
  hashId: string; // also the post id
  text: string;
}

export interface Posts {
  _id: ObjectId;
  contractAddress: string;
  hashId: string;
}

export interface Contracts {
  _id: ObjectId;
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
      console.log("Connected successfully to MongoDB!");
      const db = this.client.db(this.dbName);
      return db;
    } catch (error: any) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  table(name: string) {
    return this.client.db(this.dbName).collection(name);
  }

  keys(): Collection<Document> {
    return this.table(keysTableName);
  }

  envelops(): Collection<Document> {
    return this.table(envelopsTableName);
  }

  rawPosts(): Collection<Document> {
    return this.table(rawPostTableName);
  }

  contracts(): Collection<Document> {
    return this.table(contractsTableName);
  }

  posts(): Collection<Document> {
    return this.table(postsTableName);
  }
}
