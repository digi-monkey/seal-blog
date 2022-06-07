// note: most function here only runnable on browser
import { HexNum, HexStr } from "./types";

export const ZERO_ADDRESS = "0x" + "00".repeat(20);

export type AccountChangeCallback = (account: string | undefined) => any;
export type ChainIdChangeCallback = (chainId: string) => any;

export interface ChainConfigCurrency {
  name: string;
  symbol: string;
  decimals: number;
}
export interface ChainConfig {
  chainId: HexNum;
  rpc: string;
  chainName: string;
  blockExplorerUrl: string;
  nativeCurrency: ChainConfigCurrency;
}

export const requestAccount = async (_cb?: AccountChangeCallback) => {
  const callback: AccountChangeCallback =
    _cb || function (_account: string | undefined) {};
  const accounts: HexStr[] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  listenForAccountChanged(callback);
  return accounts;
};

export const listenForAccountChanged = (cb: AccountChangeCallback) => {
  window.ethereum.on("accountsChanged", handleAccountChanged);
  function handleAccountChanged(account: string) {
    if (account.length > 0) {
      cb(account[0]);
    } else {
      cb(undefined);
    }
  }
};

export const requestChainId = async (_cb?: ChainIdChangeCallback) => {
  const callback: ChainIdChangeCallback = _cb || function (_id: string) {};
  const chainId: HexNum = await window.ethereum.request({
    method: "net_version",
  });
  listenForChainIdChanged(callback);
  return chainId;
};

export const listenForChainIdChanged = (cb: ChainIdChangeCallback) => {
  window.ethereum.on("chainChanged", handleChainChanged);
  function handleChainChanged(chainId: string) {
    cb(chainId);
  }
};

export const getEncryptionPublicKey = async (account: string) => {
  const encryptionPublicKey =
    localStorage.getItem(account) ||
    (await requestEncryptionPublicKeyFromMetamask(account));
  return encryptionPublicKey;
};

export const requestEncryptionPublicKeyFromMetamask = async (
  account: string
) => {
  if (
    window.confirm(
      "we want to store your signing publicKey on browser for connivent, good?"
    )
  ) {
    // Save it
    const pk = (await window.ethereum.request({
      method: "eth_getEncryptionPublicKey",
      params: [account], // you must have access to the specified account
    })) as string;
    localStorage.setItem(account, pk);
    return pk;
  } else {
    // Do nothing!
    alert(
      "will not store on browser, will ask your metamask each time you need it."
    );
    return undefined;
  }
};

export const switchBlockchainNetwork = async (chainCfg: ChainConfig) => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainCfg.chainId }],
    });
  } catch (e: any) {
    if (e.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainCfg.chainId,
              chainName: chainCfg.chainName,
              nativeCurrency: {
                name: chainCfg.nativeCurrency.name,
                symbol: chainCfg.nativeCurrency.symbol, // 2-6 characters long
                decimals: chainCfg.nativeCurrency.decimals,
              },
              blockExplorerUrls: [],
              rpcUrls: [chainCfg.rpc],
            },
          ],
        });
      } catch (addError) {
        console.error(addError);
        throw addError;
      }
    }
  }
};
