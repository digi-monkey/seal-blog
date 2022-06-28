import { Badge, Card, Grid, TextField } from "@material-ui/core";
import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../hooks/useContext";
import { Account } from "../metamask/account";
import { Network } from "../metamask/network";
import { PopupSelectChainId } from "../setting/setting";
import { Text } from "degen";
import { DecEventData, getContractEventLogs, Topic, web3 } from "../../api";
import CHANEL_ARTIFACT from "../../configs/blockchain/contract-artifact/NaiveChannel.json";
import MAIL_SERVER_ARTIFACT from "../../configs/blockchain/contract-artifact/NaiveMail.json";
import ROOT_SERVER_ARTIFACT from "../../configs/blockchain/contract-artifact/NaiveRootServer.json";
import { AbiItem } from "web3-utils";
import {
  encryptTextToPk,
  decryptEncryptTextWithAccount,
  HexStr,
  Utf8Str,
  DecimalStr,
} from "@seal-blog/sdk";
import { ethers } from "ethers";
import { LocalStore } from "../../localStore";
import { predefineContractAddresses, CHAIN_NETWORKS } from "../../configs";

const styles = {
  root: {
    height: "500px",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
};

export function NaiveMail() {
  const chainId = useContext(Context).network.selectChainId;

  const [account, setAccount] = useState<string>();
  const [encryptPk, setEncryptPk] = useState<string>();

  const [mailServers, setMailServers] = useState<MailServer[]>([]);

  const [toInfo, setToInfo] = useState<MailAddressOwnerInfo>();
  const [fromInfo, setFromInfo] = useState<MailAddressOwnerInfo>();

  const [channelId, setChannelId] = useState<DecimalStr>();

  const [inputToMailAddress, setInputToMailAddress] = useState<string>();
  const [illegalToMailInput, setIllegalToMailInput] = useState<boolean>(false);
  const [toMailAddressInputErr, setToMailAddressInputErr] = useState<string>();

  const [writeMsg, setWriteMsg] = useState<string>();

  const [myObtainMailAddresses, setMyObtainMailAddresses] = useState<
    MailAddressStr[]
  >([]);
  const [mySentMailList, setMySentMailList] = useState<any>();
  const [myReceiveMailList, setMyReceiveMailList] = useState<any>();

  const [isChannelNotCreatedYet, setIsChannelNotCreatedYet] =
    useState<boolean>(false);

  const fetchAllMailServers = async () => {
    const addr = getContractAddress(chainId!, "rootServer");
    const events = await getContractEventLogs(
      addr,
      ROOT_SERVER_ARTIFACT.abi,
      "RegisterServerName"
    );
    console.log("mailServers events =>", events);
    const mailServers: MailServer[] = events.map((e) => {
      return {
        name: e.returnValues.name,
        address: e.returnValues.mailServer,
      };
    });
    setMailServers(mailServers);
  };

  const fetchMyObtainMailAddresses = async () => {
    if (account == null) return;

    const data = await findUserObtainMailAddresses(
      chainId!,
      account,
      mailServers
    );
    setMyObtainMailAddresses(data);
  };

  const fetchFromInfo = async () => {
    if (myObtainMailAddresses.length === 0) return;

    const myInfo = await getUserInfoByMailAddress(
      chainId!,
      myObtainMailAddresses[0]
    );
    if (myInfo == null) {
      return setToMailAddressInputErr("from mail not exits.");
    }
    setFromInfo(myInfo);
  };

  const fetchMySentMailMsgList = async () => {
    if (chainId == null || account == null || fromInfo == null) return;

    const logs = await querySentMailMsgFromLogs(chainId!, fromInfo.owner!);
    const mySentMailJsx = createMailMsgItemListFromLogs(
      logs,
      chainId,
      account,
      false
    );
    setMySentMailList(mySentMailJsx);
  };

  const fetchMyReceiveMailMsgList = async () => {
    if (chainId == null || account == null || fromInfo == null) return;

    const logs = await queryReceiveMailMsgFromLogs(chainId!, fromInfo.owner);
    const myReceiveMailList = createMailMsgItemListFromLogs(
      logs,
      chainId,
      account,
      true
    );
    setMyReceiveMailList(myReceiveMailList);
  };

  const registerMailAddress = async () => {
    const emailAddr = window.prompt(
      "input your email address: ",
      "alice@cyber"
    );
    if (emailAddr == null) {
      return alert("emailAddr is null");
    }
    const res = parseMailAddr(emailAddr);
    const matchServers = mailServers.filter((m) => m.name === res.server);
    if (matchServers.length === 0) {
      return alert("no match mail server @" + res.handler);
    }
    const matchServer = matchServers[0];
    const contract = getContractInstance(
      chainId!,
      "mailServer",
      matchServer.address
    );
    const price = await contract.methods.tokenPrice().call();
    const tx = await contract.methods
      .subscribeMail(account, encryptPk, res.handler)
      .send({ from: account, value: price });
    console.log(tx);
    return alert(
      `tx ${tx.transactionHash} sent, please wait for confirm in Metamask`
    );
  };

  const sendMessage = async () => {
    if (writeMsg == null) {
      return alert("msg is null");
    }

    const channelContract = getContractInstance(chainId!, "channel");

    const encryptToText = encryptTextToPk(toInfo?.pk!, writeMsg);
    const encryptFromText = encryptTextToPk(fromInfo?.pk!, writeMsg);

    const tx = await channelContract.methods
      .sendMsg(
        channelId,
        fromInfo?.nft,
        fromInfo?.tokenId!,
        encryptToText,
        encryptFromText
      )
      .send({ from: account });
    console.log(tx);
    return alert(
      `tx ${tx.transactionHash} sent, please wait for confirm in Metamask`
    );
  };

  const checkInputToMailAddress = async () => {
    if (inputToMailAddress) {
      const toMailResult = await getUserInfoByMailAddress(
        chainId!,
        inputToMailAddress
      );

      if (toMailResult == null) {
        setIllegalToMailInput(true);
        return setToMailAddressInputErr("email not exits.");
      }

      setIllegalToMailInput(false);
      setToMailAddressInputErr(undefined);

      setToInfo(toMailResult);
      const channelId = await filterChannelFromUser(
        chainId!,
        account!,
        toMailResult.owner
      );
      if (channelId == null) {
        setIsChannelNotCreatedYet(true);
        return;
      }
      setChannelId(channelId);
      setIsChannelNotCreatedYet(false);
    }
  };

  const createChannel = async () => {
    const serverName1 = parseMailAddr(myObtainMailAddresses[0]).server;
    const serverName2 = parseMailAddr(inputToMailAddress!).server;
    const nft1 = mailServers.filter((m) => m.name === serverName1)[0].address;
    const nft2 = mailServers.filter((m) => m.name === serverName2)[0].address;

    await sendCreateChannelTx(
      nft1,
      nft2,
      account!,
      toInfo?.owner!,
      fromInfo?.tokenId!,
      toInfo?.tokenId!
    );
  };

  const sendCreateChannelTx = async (
    nft1: string,
    nft2: string,
    user1: string,
    user2: string,
    token1: string,
    token2: string
  ) => {
    const channelContract = getContractInstance(chainId!, "channel");
    const tx = await channelContract.methods
      .createChannel(nft1, nft2, user1, user2, token1, token2)
      .send({ from: user1 });
    console.log(tx);
    return tx;
  };

  useEffect(() => {
    if (chainId == null) return;

    fetchAllMailServers();
  }, [chainId]);

  useEffect(() => {
    if (account != null && mailServers.length > 0) {
      fetchMyObtainMailAddresses();
    }
  }, [account, mailServers]);

  useEffect(() => {
    fetchMySentMailMsgList();
    fetchMyReceiveMailMsgList();
  }, [fromInfo]);

  useEffect(() => {
    fetchFromInfo();
  }, [myObtainMailAddresses]);

  const mailServerList = mailServers.map((m, index) => (
    <li className="block inline" key={index}>
      <a
        target={"_blank"}
        href={
          CHAIN_NETWORKS[chainId!].blockExplorerUrl + "/account/" + m.address
        }
      >
        @{m.name}
      </a>
    </li>
  ));
  const myObtainMailAddressList = myObtainMailAddresses.map((addr, id) => (
    <li className="inline block" key={id}>
      {addr}
    </li>
  ));

  return (
    <div style={styles.root}>
      <PopupSelectChainId />
      <Account
        accountCallback={setAccount}
        encryptionPublicKeyCallback={setEncryptPk}
      />
      <Card className="block fixed">
        <Text size={"large"} transform="capitalize">
          welcome to NaiveMail, a full-onchain E2E messaging experiment
        </Text>
        <hr />
        <Grid container spacing={4} style={{ fontSize: "16px" }}>
          <Grid item xs={4}>
            {mailServerList}
          </Grid>
          <Grid item xs={8}>
            Your Mail addresses:{" "}
            {myObtainMailAddressList.length > 0
              ? myObtainMailAddressList
              : "None"}{" "}
            |{" "}
            <button className="block inline" onClick={registerMailAddress}>
              Register
            </button>
          </Grid>
        </Grid>
      </Card>
      <Card className="block fixed">
        <Grid container spacing={4}>
          <Grid item xs={4} style={{ backgroundColor: "darkgray" }}>
            From
            <span className="block fixed inline" style={{ fontSize: "20px" }}>
              {myObtainMailAddresses.length > 0 ? (
                myObtainMailAddresses[0]
              ) : (
                <Text transform="capitalize">
                  {"no mail yet, please register one"}
                </Text>
              )}
            </span>{" "}
            <hr />
            <form style={{ marginBottom: "40px" }}>
              To{" "}
              <input
                onChange={(event) => setInputToMailAddress(event.target.value)}
                value={inputToMailAddress}
                onMouseLeave={checkInputToMailAddress}
                style={{
                  fontSize: "20px",
                  padding: "5px",
                  borderColor:
                    isChannelNotCreatedYet || illegalToMailInput
                      ? "red"
                      : "black",
                }}
                className="block wrap inline"
                type="text"
              />
              {illegalToMailInput && toMailAddressInputErr}{" "}
              {isChannelNotCreatedYet && !illegalToMailInput && (
                <span>
                  <button
                    className="block inline"
                    type="button"
                    onClick={createChannel}
                  >
                    create channel
                  </button>
                </span>
              )}
              <TextField
                name="text"
                className="block"
                style={{
                  width: "100%",
                  textAlign: "left",
                  margin: "20px 5px 10px 5px",
                }}
                multiline
                variant="filled"
                rows={10}
                placeholder={"write E2E mail."}
                value={writeMsg}
                onChange={(e) => {
                  setWriteMsg(e.target.value);
                }}
              />
              <button
                style={{ fontSize: "20px" }}
                className="block accent"
                type="button"
                onClick={sendMessage}
              >
                Send
              </button>
            </form>
          </Grid>
          <Grid item xs={8}>
            <span
              className="block fixed inline accent"
              style={{ fontSize: "20px" }}
            >
              Received
            </span>{" "}
            {myReceiveMailList}
            <hr />
            <span
              className="block fixed inline accent"
              style={{ fontSize: "20px" }}
            >
              Sent
            </span>{" "}
            {mySentMailList}
            <hr />
          </Grid>
        </Grid>
      </Card>

      <br />
      <br />
      <br />
      <br />
      <span className="block fixed">
        <Network></Network>
      </span>
      <hr />
    </div>
  );
}

export interface MsgItemListProp {
  chainId: HexStr;
  log: DecEventData;
  decryptAccount: HexStr;
  enableIsReadBadge: boolean;
  id: number;
}

export function MsgItemList(props: MsgItemListProp) {
  const { chainId, log, enableIsReadBadge, id, decryptAccount } = props;

  const [fullAddr, setFullAddr] = useState<string>();
  const [msgTime, setMsgTime] = useState<string>();
  const [isRead, setIsRead] = useState<boolean>(
    isMailMsgRead(chainId, log.transactionHash)
  );

  const fetchFullAddr = async () => {
    const data = await getCounterPartyMailAddress(
      chainId,
      log.returnValues.channelId,
      log.returnValues.toNotifyUser
    );
    if (data != null) {
      setFullAddr(data);
    }
  };

  const fetchTimeStamp = async () => {
    const timeStamp = +(await web3.eth.getBlock(log.blockNumber)).timestamp;
    const d = new Date(timeStamp * 1000).toLocaleString();
    setMsgTime(d);
  };

  useEffect(() => {
    fetchFullAddr();
    fetchTimeStamp();
  }, [log]);

  const normalReadBtn = (
    <button
      className="block inline"
      onClick={async () => {
        const encryptMsg = log.returnValues.msg;
        const msg = await decryptEncryptTextWithAccount(
          encryptMsg,
          decryptAccount
        );
        alert(msg);
        setMailMsgRead(chainId, log.transactionHash);
        setIsRead(true);
      }}
    >
      Read
    </button>
  );
  const readBtnWithBadge = (
    <Badge badgeContent={1} color="error">
      {normalReadBtn}
    </Badge>
  );
  const enableBadgeReadBtn = isRead ? normalReadBtn : readBtnWithBadge;
  const readBtn = enableIsReadBadge ? enableBadgeReadBtn : normalReadBtn;

  return (
    <li style={{ fontSize: "18px" }} className="block fixed" key={id}>
      <Grid container>
        <Grid item xs={3}>
          <span className="block round inline">{fullAddr || "..."}</span>
        </Grid>
        <Grid item xs={4}>
          <span style={{ color: "gray" }}> {msgTime || "..."}</span>
        </Grid>
        <Grid item xs={1}></Grid>
        <Grid item xs={3}>
          {(log.returnValues.msg.length - 2) / 2} bytes
        </Grid>
        <Grid item xs={1}>
          {readBtn}
        </Grid>
      </Grid>
    </li>
  );
}

// types
export interface MailServer {
  name: string; // the string after @
  address: HexStr;
}

export interface MailAddressOwnerInfo {
  nft: HexStr; // nft contract address
  tokenId: string;
  pk: string;
  owner: HexStr;
}

export enum MailMsgReadStatus {
  unread = "0",
  read = "1",
}

export type MailAddressStr = Utf8Str;

// helper functions
function getContractInstance(
  chainId: HexStr,
  contractType: "channel" | "rootServer" | "mailServer",
  _address?: HexStr
) {
  switch (contractType) {
    case "channel": {
      const address =
        _address || predefineContractAddresses[chainId].NaiveChannel;
      if (address == null) throw new Error("address must be provided!");
      return new web3.eth.Contract(CHANEL_ARTIFACT.abi as AbiItem[], address);
    }

    case "rootServer": {
      const address =
        _address || predefineContractAddresses[chainId].NaiveRootServer;
      if (address == null) throw new Error("address must be provided!");
      return new web3.eth.Contract(
        ROOT_SERVER_ARTIFACT.abi as AbiItem[],
        address
      );
    }

    case "mailServer": {
      const address = _address;
      if (address == null) throw new Error("address must be provided!");
      return new web3.eth.Contract(
        MAIL_SERVER_ARTIFACT.abi as AbiItem[],
        address
      );
    }

    default:
      throw new Error("no contract type supported!");
  }
}

function getContractAddress(
  chainId: HexStr,
  contractType: "channel" | "rootServer"
): string {
  switch (contractType) {
    case "channel": {
      return predefineContractAddresses[chainId].NaiveChannel!;
    }

    case "rootServer": {
      return predefineContractAddresses[chainId].NaiveRootServer!;
    }

    default:
      throw new Error("no contract type supported!");
  }
}

async function getFullEmailAddressFromNFT(
  chainId: HexStr,
  nftAddr: string,
  tokenId: string
) {
  const eventName = "RegisterServerName";
  const topics: Topic[] = [null, nftAddr];
  const events = await getContractEventLogs(
    getContractAddress(chainId, "rootServer"),
    ROOT_SERVER_ARTIFACT.abi,
    eventName,
    topics
  );
  if (events.length === 0) {
    return null;
  }

  const serverName = events[0].returnValues.name;
  const mailServerAddress = events[0].returnValues.mailServer;

  // get handler name
  const eventName2 = "RegisterMailAddress";
  const topics2: Topic[] = [null, ethers.utils.hexlify(+tokenId)];
  const events2 = await getContractEventLogs(
    mailServerAddress,
    MAIL_SERVER_ARTIFACT.abi,
    eventName2,
    topics2
  );

  if (events2.length === 0) {
    return null;
  }

  const handler = events2[0].returnValues.mailAddrStr;
  const fullMailAddress = handler + "@" + serverName;
  return fullMailAddress;
}

async function getCounterPartyMailAddress(
  chainId: HexStr,
  channelId: string,
  excludeAccount: HexStr
) {
  const contract = getContractInstance(chainId, "channel");
  const channel = await contract.methods.channelById(channelId).call();
  const mailContract = getContractInstance(chainId, "mailServer", channel.nft1);
  const address = await mailContract.methods.ownerOf(channel.token1).call();
  // todo: what if both are the same user?
  if (address != excludeAccount) {
    return getFullEmailAddressFromNFT(chainId, channel.nft1, channel.token1);
  } else {
    return getFullEmailAddressFromNFT(chainId, channel.nft2, channel.token2);
  }
}

async function findUserObtainMailAddresses(
  chainId: HexStr,
  account: string,
  mailServers: MailServer[]
) {
  const tokenIds: {
    tokenId: string;
    contract: string;
    serverName: string;
  }[] = [];
  for (const m of mailServers) {
    const contract = getContractInstance(chainId, "mailServer", m.address);
    const balance = await contract.methods.balanceOf(account).call();
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.methods
        .tokenOfOwnerByIndex(account, i)
        .call();
      tokenIds.push({
        tokenId,
        contract: m.address,
        serverName: m.name,
      });
      console.log("tokenIds=>", tokenIds);
    }
  }

  const mailAddress: string[] = [];
  for (const id of tokenIds) {
    const event = await getContractEventLogs(
      id.contract,
      MAIL_SERVER_ARTIFACT.abi,
      "RegisterMailAddress",
      [null, ethers.utils.hexlify(+id.tokenId)]
    );
    for (const e of event) {
      mailAddress.push(e.returnValues.mailAddrStr + "@" + id.serverName);
    }
  }
  return mailAddress;
}

async function getUserInfoByMailAddress(chainId: HexStr, mailAddr: string) {
  const contract = getContractInstance(chainId, "rootServer");
  try {
    const addr = parseMailAddr(mailAddr);
    const result: MailAddressOwnerInfo | null = await contract.methods
      .getUserInfoByMailAddress(addr.handler, addr.server)
      .call();
    return result;
  } catch (error: any) {
    console.log(error.message);
  }
  return null;
}

function parseMailAddr(mailAddr: string) {
  const handler = mailAddr.split("@")[0];
  const server = mailAddr.split("@")[1];
  return { handler, server };
}

async function filterChannelFromUser(
  chainId: HexStr,
  fromAddr: HexStr,
  toAddr: HexStr
) {
  let channelId: string | undefined;

  const eventName = "CreateChannel";
  const topics = [null, [fromAddr, toAddr], [fromAddr, toAddr]];
  const events = await getContractEventLogs(
    getContractAddress(chainId, "channel"),
    CHANEL_ARTIFACT.abi,
    eventName,
    topics
  );

  if (events.length > 0) {
    channelId = events[0].returnValues.channelId;
  }

  return channelId;
}

async function querySentMailMsgFromLogs(chainId: HexStr, fromAccount: HexStr) {
  const eventName = "SentMessage";
  const topics: Topic[] = [null, fromAccount, null];
  const _events = await getContractEventLogs(
    getContractAddress(chainId, "channel"),
    CHANEL_ARTIFACT.abi,
    eventName,
    topics
  );
  const events = _events.reverse();
  console.log("sent event:", events);
  return events;
}

async function queryReceiveMailMsgFromLogs(
  chainId: HexStr,
  toNotifyAccount: HexStr
) {
  const eventName = "NewMessage";
  const topics: Topic[] = [null, toNotifyAccount, null];
  const events = await getContractEventLogs(
    getContractAddress(chainId, "channel"),
    CHANEL_ARTIFACT.abi,
    eventName,
    topics
  );
  console.log("receive event:", events);
  return events.reverse();
}

function createMailMsgItemListFromLogs(
  logs: DecEventData[],
  chainId: HexStr,
  decryptAccount: HexStr,
  enableIsReadBadge: boolean = true
) {
  return logs.map((log, id) => (
    <MsgItemList
      chainId={chainId}
      enableIsReadBadge={enableIsReadBadge}
      decryptAccount={decryptAccount}
      log={log}
      id={id}
    />
  ));
}

function getIsReadStoreKey(chainId: HexStr, txHash: HexStr) {
  const key = "isRead/" + chainId + "/" + txHash;
  return key;
}

function isMailMsgRead(chainId: HexStr, txHash: HexStr) {
  const key = getIsReadStoreKey(chainId, txHash);

  const isRead = LocalStore.getValueByKey(key);
  if (isRead == null) {
    LocalStore.saveKV(key, MailMsgReadStatus.unread);
    return false;
  }

  return isRead === MailMsgReadStatus.read;
}

function setMailMsgRead(chainId: HexStr, txHash: HexStr) {
  const key = getIsReadStoreKey(chainId, txHash);
  LocalStore.saveKV(key, MailMsgReadStatus.read);
}
