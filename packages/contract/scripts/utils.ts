import fs from "fs";

export function createDirIfNotExist(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function readJsonFile(filePath: string) {
  try {
    const data = await fs.readFileSync(filePath);
    return JSON.parse(data.toLocaleString()) as Object;
  } catch (error) {
    return null;
  }
}

export async function writeJsonFile(
  content: Object,
  filePath: string,
  append: boolean = true
) {
  const origin = await readJsonFile(filePath);
  if (!append || origin == null) {
    const data = JSON.stringify(content);
    return await fs.writeFileSync(filePath, data);
  }

  const data = { ...origin, ...content };
  const newData = JSON.stringify(data);
  return await fs.writeFileSync(filePath, newData);
}

// convert decimal between ckb and eth under polyjuice
// NOTE!! the convert is not about the price value, only in literal decimal, since polyjuice use ckb as its own "eth"(8), the real ether in ethereum is(18)
export const decimalHelper = {
  ckbToEth: (amount: string) => {
    return (BigInt(amount) * BigInt(100_0000_0000)).toString(10);
  },
  ethToCkb: (amount: string) => {
    return (BigInt(amount) / BigInt(100_0000_0000)).toString(10);
  },
};
