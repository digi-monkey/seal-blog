import { createAvatar } from "@dicebear/avatars";
import * as style from "@dicebear/open-peeps";
import fs from "fs";
import path from "path";

export const randomByNumber = async (seed: number) => {
  const svg = createAvatar(style, {
    seed: seed.toString(),
  });
  const filePath = path.resolve(__dirname, `../avatars/${seed.toString()}.svg`);
  await fs.writeFileSync(filePath, svg);
  console.log(`generated ${seed}th svg.`);
};

export const randomByHash = async () => {
  const hash =
    "0x581b9a20e29739735d6a823d6222df4e5b6faad36d5bc2aa6dbc11e4d4009a1c";
  const svg = createAvatar(style, {
    seed: hash,
  });
  const filePath = path.resolve(__dirname, `../avatars/${hash}.svg`);
  await fs.writeFileSync(filePath, svg);
  console.log(`generated ${hash}th svg.`);
};
