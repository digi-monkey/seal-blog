import React, { useContext, useEffect, useState } from "react";
import { Button, IconUserSolid, IconWallet, IconCog, Stack } from "degen";
import { Grid } from "@material-ui/core";
import { PopupSelectChainId, SettingMenu } from "../setting/setting";
import { getChainNetwork } from "../../configs";
import { HexNum } from "@seal-blog/sdk";
import { Context } from "../../hooks/useContext";

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
  const selectChainId = useContext(Context).network.selectChainId;

  const [account, setAccount] = useState<string>();
  const [encryptionPublicKey, setEncryptionPublicKey] = useState<string>();
  const [chainId, setChainId] = useState<string>();
  const [openSettingMenu, setOpenSettingMenu] = useState<boolean>(false);

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
    if (chainId && selectChainId && chainId !== selectChainId) {
      const toSwitch = window.confirm(
        `Your metamask network(${chainId}) is different with your setting network(${selectChainId})! Please switch back to right one or change your setting!`
      );
      if (toSwitch) {
        requestSwitchingNetwork(selectChainId);
      }
    }
  }, [chainId]);

  useEffect(() => {
    if (selectChainId != null) {
      requestSwitchingNetwork(selectChainId);
    }
  }, [selectChainId]);

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
      let chainId = await window.ethereum.request({
        method: "net_version",
      });
      chainId = "0x" + BigInt(chainId).toString(16);
      await setChainId(chainId);
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

  const requestSwitchingNetwork = async (selectChainId: HexNum) => {
    const configChain = getChainNetwork(selectChainId!);
    if (chainId === selectChainId) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: selectChainId }],
      });
    } catch (e: any) {
      if (e.code === 4902) {
        try {
          let network: any = {
            chainId: selectChainId,
            chainName: configChain.chainName,
            nativeCurrency: {
              name: configChain.nativeCurrency.name,
              symbol: configChain.nativeCurrency.symbol, // 2-6 characters long
              decimals: configChain.nativeCurrency.decimals,
            },
            rpcUrls: [configChain.rpc],
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
        <Grid item xs={2}>
          <Stack align={"center"}>
            <Button
              prefix={<IconWallet />}
              variant="secondary"
              width={{ xs: "full", md: "max" }}
            >
              {encryptionPublicKey?.slice(0, 18)}..
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
            <PopupSelectChainId />
          </Stack>
        </Grid>
        <Grid item xs={2}>
          <Stack align={"flex-end"}>
            <Button
              prefix={<IconCog />}
              variant="secondary"
              width={{ xs: "full", md: "max" }}
              onClick={() => setOpenSettingMenu(!openSettingMenu)}
            >
              Setting
            </Button>
            <SettingMenu
              open={openSettingMenu}
              close={() => setOpenSettingMenu(false)}
            />
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
