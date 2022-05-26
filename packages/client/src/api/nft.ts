import { createAvatar } from "@dicebear/avatars";
import * as style from "@dicebear/open-peeps";
import crypto from "crypto";

export const avatar = {
  genBySeed: async (seed: number | string) => {
    const svg = createAvatar(style, {
      seed: seed.toString(),
    });
    return svg;
  },

  random: async () => {
    const hash = "0x" + crypto.randomBytes(16).toString("hex");
    const svg = createAvatar(style, {
      seed: hash,
    });
    return svg;
  },
};
