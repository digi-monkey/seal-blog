import { createAvatar } from "@dicebear/avatars";
import * as style from "@dicebear/avataaars";
import crypto from "crypto";

export const avatar = {
  genBySeed: (seed: number | string) => {
    const svg = createAvatar(style, {
      seed: seed.toString(),
    });
    return svg;
  },

  random: () => {
    const hash = "0x" + crypto.randomBytes(16).toString("hex");
    const svg = createAvatar(style, {
      seed: hash,
    });
    return svg;
  },
};
