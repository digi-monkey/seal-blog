export * from "./mongo";
export * from "./query";
import { Database } from "./mongo";

export const database = new Database();
