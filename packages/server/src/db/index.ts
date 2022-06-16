export * from "./mongo";
export * from "./query";
export * from "./types";
import { Database } from "./mongo";

export const database = new Database();
