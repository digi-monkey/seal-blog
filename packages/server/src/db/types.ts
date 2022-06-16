import { Document } from "mongodb";

export interface Key extends Document {
  postId: string; // chain_id | contract address | content hash id
  key: string;
  iv: string;
}

export interface Envelop extends Document {
  postId: string;
  pk: string;
  envelop: string;
}

export interface RawPost extends Document {
  postId: string;
  text: string;
}

// use to find all post ids from specific contracts
export interface Posts extends Document {
  postId: string;
  contractAddress: string;
}

export interface Contracts extends Document {
  chainId: string;
  account: string;
  contractAddress: string;
}
