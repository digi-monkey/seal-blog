import test from "ava";
import { Database } from "../src/db";

test("test db", async (t) => {
  const db = new Database();
  await db.load();
  const table = db.table("keys");
  const doc = {
    title: "Record of a Shriveled Datum",
    content: "No bytes, no problem. Just insert a document, in MongoDB",
  };
  const result = await table.insertOne(doc);
  const res = await table.findOne({ title: doc.title });
  console.log(result, res);
  t.not(doc, undefined);
});
