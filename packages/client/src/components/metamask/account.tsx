import React, { useEffect, useState } from "react";
import { Button, IconUserSolid, IconWallet, Stack } from "degen";
import { Grid } from "@material-ui/core";
import { configChainId, configChainRpcUrl, configChain } from "../../api";

const styles = {
  siteName: {
    fontSize: "20px",
    FontWeight: "200",
  },
  siteLogo: {
    width: "80px",
    height: "80px",
  },
};
declare global {
  interface Window {
    ethereum: any;
  }
}

export interface AccountProp {
  accountCallback?: (account: string) => any;
  encryptionPublicKeyCallback?: (pk: string) => any;
  chainIdCallBack?: (chainId: string) => any;
}

export function Account(prop: AccountProp) {
  const [account, setAccount] = useState<string>();
  const [encryptionPublicKey, setEncryptionPublicKey] = useState<string>();
  const [chainId, setChainId] = useState<string>();

  useEffect(() => {
    connectWallet();
    requestChainId();
  }, []);

  useEffect(() => {
    if (prop.accountCallback != null && account != null) {
      prop.accountCallback(account);
    }

    if (account != null) {
      getEncryptionPublicKey(account);
    }
  }, [account]);

  useEffect(() => {
    if (
      encryptionPublicKey != null &&
      prop.encryptionPublicKeyCallback != null
    ) {
      prop.encryptionPublicKeyCallback(encryptionPublicKey);
    }
  }, [encryptionPublicKey]);

  useEffect(() => {
    if (chainId != null && prop.chainIdCallBack != null) {
      prop.chainIdCallBack(chainId);
    }
  }, [chainId]);

  const connectWallet = async () => {
    if (!account) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      await setAccount(accounts[0]);
      listenForAccountChanged();
    }
  };

  const listenForAccountChanged = () => {
    window.ethereum.on("accountsChanged", handleAccountChanged);
    function handleAccountChanged(account: string) {
      if (account.length > 0) {
        setAccount(account[0]);
      } else {
        setAccount(undefined);
      }
    }
  };

  const requestChainId = async () => {
    if (!chainId) {
      const chainId = await window.ethereum.request({
        method: "net_version",
      });
      await setChainId(chainId);
      await requestNetwork();
      listenForChainChanged();
    }
  };

  const listenForChainChanged = () => {
    window.ethereum.on("chainChanged", handleChainChanged);
    function handleChainChanged(chainId: string) {
      setChainId(chainId);
    }
  };

  const getEncryptionPublicKey = async (account: string) => {
    const encryptionPublicKey =
      localStorage.getItem(account) ||
      (await requestEncryptionPublicKeyFromMetamask(account));
    await setEncryptionPublicKey(encryptionPublicKey);
    return encryptionPublicKey;
  };

  const requestEncryptionPublicKeyFromMetamask = async (account: string) => {
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

  const requestNetwork = async () => {
    if (chainId === configChainId) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: configChainId }],
      });
    } catch (e: any) {
      if (e.code === 4902) {
        try {
          let network: any = {
            chainId: configChainId,
            chainName: configChain.chainName,
            nativeCurrency: {
              name: configChain.nativeCurrency.name,
              symbol: configChain.nativeCurrency.symbol, // 2-6 characters long
              decimals: configChain.nativeCurrency.decimals,
            },
            rpcUrls: [configChainRpcUrl],
          };
          if (configChain.blockExplorerUrl != null) {
            network.blockExplorerUrls = [configChain.blockExplorerUrl];
          }
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [network],
          });
        } catch (addError) {
          console.error(addError);
        }
      }
    }
  };

  return (
    <div>
      <Grid container spacing={1}>
        <Grid item xs={4}>
          <div style={styles.siteName}>
            <a href="/user">
              <img
                style={styles.siteLogo}
                src={process.env.PUBLIC_URL + "/seal-logo.png"}
                alt="Seal Blog"
              />
            </a>
          </div>
        </Grid>
        <Grid item xs={4}>
          <Stack align={"center"}>
            <Button
              prefix={<IconWallet />}
              variant="secondary"
              width={{ xs: "full", md: "max" }}
            >
              {encryptionPublicKey}
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={4}>
          <Stack align={"flex-end"}>
            <Button
              prefix={<IconUserSolid />}
              variant="highlight"
              width={{ xs: "full", md: "max" }}
            >
              {showShortEthAddress(account)}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </div>
  );
}

export function showShortEthAddress(account: string | undefined) {
  return `${account?.toUpperCase().slice(0, 6)}...${account
    ?.toUpperCase()
    .slice(-6)}`;
}
