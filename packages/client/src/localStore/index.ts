import { HexNum } from "@seal-blog/sdk";

const SELECT_CHAIN_ID_KEY = "Seal:selectChainId";

export const LocalStore = {
  selectChainId: () => localStorage.getItem(SELECT_CHAIN_ID_KEY),
  saveSelectChainId: (chainId: HexNum) =>
    localStorage.setItem(SELECT_CHAIN_ID_KEY, chainId),
  saveKV: (key: string, value: string) => localStorage.setItem(key, value),
  getValueByKey: (key: string) => localStorage.getItem(key),
};
