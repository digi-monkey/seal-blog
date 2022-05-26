import express from "express";
import cors from "cors";
import { MainService } from "./services/main";
import { setUpRouters } from "./http-server";
import { database } from "./db";

export const app = express();
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));

const service = new MainService();
setUpRouters(app, service, MainService);

const port = process.env.PORT || 3000;

export async function start() {
  await database.load();
  app.listen(port, () => {
    console.log(`${service.name} started at http://localhost:${port}`);
  });
}

start();
