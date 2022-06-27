import { Badge, Card, Grid, TextField } from "@material-ui/core";
import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../hooks/useContext";
import { Account } from "../metamask/account";
import { Network } from "../metamask/network";
import { PopupSelectChainId } from "../setting/setting";
import { Button, Text } from "degen";
import { DecEventData, getContractEventLogs, Topic, web3 } from "../../api";
import CHANEL_ARTIFACT from "../../configs/blockchain/msg-contract-artifact.json";
import MAIL_SERVER_ARTIFACT from "../../configs/blockchain/mail-contract-artifact.json";
import ROOT_SERVER_ARTIFACT from "../../configs/blockchain/mail-root-contract-artifact.json";
import { AbiItem } from "web3-utils";
import {
  encryptTextToPk,
  decryptEncryptTextWithAccount,
  HexStr,
} from "@seal-blog/sdk";
import { ethers } from "ethers";
import { LocalStore } from "../../localStore";

const styles = {
  root: {
    height: "500px",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
};

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

export function NaiveMail() {
  const chainId = useContext(Context).network.selectChainId;
  const channelContractFactory = new web3.eth.Contract(
    CHANEL_ARTIFACT.abi as AbiItem[]
  );
  const rootServerContractFactory = new web3.eth.Contract(
    ROOT_SERVER_ARTIFACT.abi as AbiItem[]
  );

  function getContractInstance(
    contractType: "channel" | "rootServer" | "mailServer",
    _address?: HexStr
  ) {
    switch (contractType) {
      case "channel": {
        const address = _address || channelAddr;
        if (address == null) throw new Error("address must be provided!");
        return new web3.eth.Contract(CHANEL_ARTIFACT.abi as AbiItem[], address);
      }

      case "rootServer": {
        const address = _address || rootServerAddr;
        if (address == null) throw new Error("address must be provided!");
        return new web3.eth.Contract(
          ROOT_SERVER_ARTIFACT.abi as AbiItem[],
          address
        );
      }

      case "mailServer": {
        const address = _address || mailServerAddr;
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

  async function getFullEmailAddressFromNFT(nftAddr: string, tokenId: string) {
    const eventName = "RegisterServerName";
    const topics: Topic[] = [null, nftAddr];
    const events = await getContractEventLogs(
      rootServerAddr,
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
    channelId: string,
    excludeAccount: HexStr
  ) {
    const contract = getContractInstance("channel", channelAddr);
    const channel = await contract.methods.channelById(channelId).call();
    const mailContract = getContractInstance("mailServer", channel.nft1);
    const address = await mailContract.methods.ownerOf(channel.token1).call();
    // todo: what if both are the same user?
    if (address != excludeAccount) {
      return getFullEmailAddressFromNFT(channel.nft1, channel.token1);
    } else {
      return getFullEmailAddressFromNFT(channel.nft2, channel.token2);
    }
  }

  function getIsReadKey(txHash: HexStr) {
    const key = "isRead/" + chainId + "/" + txHash;
    return key;
  }

  function isMailMsgRead(txHash: HexStr) {
    if (chainId == null) return;

    const key = getIsReadKey(txHash);

    const isRead = LocalStore.getValueByKey(key);
    if (isRead == null) {
      LocalStore.saveKV(key, MailMsgReadStatus.unread);
      return false;
    }

    return isRead === MailMsgReadStatus.read;
  }

  function setMailMsgRead(txHash: HexStr) {
    if (chainId == null) return;

    const key = getIsReadKey(txHash);
    LocalStore.saveKV(key, MailMsgReadStatus.read);
  }

  const [account, setAccount] = useState<string>();
  const [encryptPk, setEncryptPk] = useState<string>();
  const [isChannelDeployed, setIsChannelDeployed] = useState(true);
  const [channelAddr, setChannelAddr] = useState<string>(
    "0x7DA79EccF920e7Bb895759f36158656723eaBBe9"
  );
  const [isMailTokenDeployed, setIsMailTokenDeployed] = useState(true);
  const [mailServerAddr, setMailServerAddr] = useState<string>(
    "0xbd1183c2fb7a70bdb0348208cd6f0e6c226d3f19"
  );
  const [isRootServerDeployed, setIsRootServerDeployed] = useState(true);
  const [rootServerAddr, setRootServerAddr] = useState<string>(
    "0x63D14F63C9Cac557225633D45899584edcB9639f"
  );

  const [mailServers, setMailServers] = useState<MailServer[]>([]);

  const fetchAllMailServers = async () => {
    const events = await getContractEventLogs(
      rootServerAddr,
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

  const mailServerList = mailServers.map((m, index) => (
    <li className="block inline" key={index}>
      <a href={"/mail-server/" + m.address}>@{m.name}</a>
    </li>
  ));

  const findUserObtainMailAddresses = async (
    account: string,
    mailServers: MailServer[]
  ) => {
    const tokenIds: {
      tokenId: string;
      contract: string;
      serverName: string;
    }[] = [];
    for (const m of mailServers) {
      const contract = getContractInstance("mailServer", m.address);
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
  };

  const [myObtainMailAddresses, setMyObtainMailAddresses] = useState<string[]>(
    []
  );
  const fetchMyObtainMailAddresses = async () => {
    if (account == null) return;

    const data = await findUserObtainMailAddresses(account, mailServers);
    setMyObtainMailAddresses(data);
  };
  const myObtainMailAddressList = myObtainMailAddresses.map((addr, id) => (
    <li className="inline block" key={id}>
      {addr}
    </li>
  ));

  const [mySentMail, setMySentMail] = useState<DecEventData[]>([]);
  const findUserSentMailMsg = async () => {
    if (fromMail == null) return;

    const eventName = "SentMessage";
    const topics: Topic[] = [null, fromMail.owner, null];
    console.log(eventName, topics);
    const events = await getContractEventLogs(
      channelAddr,
      CHANEL_ARTIFACT.abi,
      eventName,
      topics
    );
    console.log("sent event:", events);
    setMySentMail(events.reverse());
  };
  const [mySentMailList, setMySentMailList] = useState<any>();
  const fetchMySentMailList = async () => {
    const p = mySentMail.map(async (e, id) => {
      const fullAddr = await getCounterPartyMailAddress(
        e.returnValues.channelId,
        e.returnValues.sentFromUser
      );
      const timeStamp = +(await web3.eth.getBlock(e.blockNumber)).timestamp;
      return (
        <li style={{ fontSize: "18px" }} className="block fixed" key={id}>
          <Grid container>
            <Grid item xs={3}>
              <span className="block round inline">{fullAddr}</span>
            </Grid>
            <Grid item xs={4}>
              <span style={{ color: "gray" }}>
                {" "}
                {new Date(timeStamp * 1000).toLocaleString()}
              </span>
            </Grid>
            <Grid item xs={1}></Grid>
            <Grid item xs={3}>
              {(e.returnValues.msg.length - 2) / 2} bytes
            </Grid>
            <Grid item xs={1}>
              <button
                className="block inline"
                onClick={async () => {
                  const encryptMsg = e.returnValues.msg;
                  const msg = await decryptEncryptTextWithAccount(
                    encryptMsg,
                    account!
                  );
                  alert(msg);
                  setMailMsgRead(e.transactionHash);
                }}
              >
                Read
              </button>
            </Grid>
          </Grid>
        </li>
      );
    });
    const mySentMailJsx = await Promise.all(p);
    setMySentMailList(mySentMailJsx);
  };

  const [myReceiveMail, setMyReceiveMail] = useState<DecEventData[]>([]);
  const findUserReceiveMailMsg = async () => {
    if (fromMail == null) return;

    const eventName = "NewMessage";
    const topics: Topic[] = [null, fromMail.owner, null];
    console.log(eventName, topics);
    const events = await getContractEventLogs(
      channelAddr,
      CHANEL_ARTIFACT.abi,
      eventName,
      topics
    );
    console.log("receive event:", events);
    setMyReceiveMail(events.reverse());
  };
  const [myReceiveMailList, setMyReceiveMailList] = useState<any>();
  const fetchMyReceiveMailList = async () => {
    const p = myReceiveMail.map(async (e, id) => {
      const isRead = isMailMsgRead(e.transactionHash);
      const fullAddr = await getCounterPartyMailAddress(
        e.returnValues.channelId,
        e.returnValues.toNotifyUser
      );
      const timeStamp = +(await web3.eth.getBlock(e.blockNumber)).timestamp;
      return (
        <li style={{ fontSize: "18px" }} className="block fixed" key={id}>
          <Grid container>
            <Grid item xs={3}>
              <span className="block round inline">{fullAddr}</span>
            </Grid>
            <Grid item xs={4}>
              <span style={{ color: "gray" }}>
                {" "}
                {new Date(timeStamp * 1000).toLocaleString()}
              </span>
            </Grid>
            <Grid item xs={1}></Grid>
            <Grid item xs={3}>
              {(e.returnValues.msg.length - 2) / 2} bytes
            </Grid>
            <Grid item xs={1}>
              {!isRead && (
                <Badge badgeContent={1} color="error">
                  <button
                    className="block inline"
                    onClick={async () => {
                      const encryptMsg = e.returnValues.msg;
                      const msg = await decryptEncryptTextWithAccount(
                        encryptMsg,
                        account!
                      );
                      alert(msg);
                      setMailMsgRead(e.transactionHash);
                    }}
                  >
                    Read
                  </button>{" "}
                </Badge>
              )}
              {isRead && (
                <button
                  className="block inline"
                  onClick={async () => {
                    const encryptMsg = e.returnValues.msg;
                    const msg = await decryptEncryptTextWithAccount(
                      encryptMsg,
                      account!
                    );
                    alert(msg);
                    setMailMsgRead(e.transactionHash);
                  }}
                >
                  Read
                </button>
              )}
            </Grid>
          </Grid>
        </li>
      );
    });
    const myReceiveMailList = await Promise.all(p);
    setMyReceiveMailList(myReceiveMailList);
  };

  const subscribeMail = async () => {
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
    const contract = getContractInstance("mailServer", matchServer.address);
    const price = await contract.methods.tokenPrice().call();
    const tx = await contract.methods
      .subscribeMail(account, encryptPk, res.handler)
      .send({ from: account, value: price });
    console.log(tx);
  };

  useEffect(() => {
    if (mySentMail.length > 0) {
      fetchMySentMailList();
    }
  }, [mySentMail]);

  useEffect(() => {
    if (myReceiveMail.length > 0) {
      fetchMyReceiveMailList();
    }
  }, [myReceiveMail]);

  const [toMail, setToMail] = useState<MailAddressOwnerInfo>();
  const [fromMail, setFromMail] = useState<MailAddressOwnerInfo>();

  const [writeMsg, setWriteMsg] = useState<string>();

  const [toMailAddr, setToMailAddr] = useState<string>();
  const [illegalToMailInput, setIllegalToMailInput] = useState<boolean>(false);
  const [toMailAddrInputErr, setToMailAddrInputErr] = useState<string>();
  const [channelId, setChannelId] = useState<string>();

  if (chainId == null) {
    alert("no chain id!");
  }

  const deployRootServer = async () => {
    const contractFactory = new web3.eth.Contract(
      ROOT_SERVER_ARTIFACT.abi as AbiItem[]
    );
    await contractFactory
      .deploy({
        data: ROOT_SERVER_ARTIFACT.bytecode,
        arguments: [],
      })
      .send({
        from: account!,
      })
      .on("transactionHash", function (txHash) {
        console.log("txHash:", txHash);
      })
      .on("error", function (err) {
        console.log(err.message);
      })
      .on("receipt", async function (receipt) {
        setIsRootServerDeployed(true);
        const address = receipt.contractAddress;
        setRootServerAddr(address!);
        const txHash = receipt.transactionHash;
        console.log(txHash);
      });
  };

  const setServerName = async () => {
    const contractFactory = new web3.eth.Contract(
      ROOT_SERVER_ARTIFACT.abi as AbiItem[]
    );
    contractFactory.options.address = rootServerAddr;

    const serverName = window.prompt(
      "input your mail server name(the @ thing): ",
      "myEmail"
    );
    if (serverName == null) {
      return alert("serverName is null");
    }
    const tx = await contractFactory.methods
      .setServerName(mailServerAddr, serverName)
      .send({ from: account });
    console.log(tx);
  };

  const deployMailToken = async () => {
    const contractFactory = new web3.eth.Contract(
      MAIL_SERVER_ARTIFACT.abi as AbiItem[]
    );
    await contractFactory
      .deploy({
        data: MAIL_SERVER_ARTIFACT.bytecode,
        arguments: [0, "0x" + "00".repeat(20), "", 0, 0],
      })
      .send({
        from: account!,
      })
      .on("transactionHash", function (txHash) {
        console.log("txHash:", txHash);
      })
      .on("error", function (err) {
        console.log(err.message);
      })
      .on("receipt", async function (receipt) {
        setIsMailTokenDeployed(true);
        const address = receipt.contractAddress;
        setMailServerAddr(address!);
        const txHash = receipt.transactionHash;
        console.log(txHash);
      });
  };

  const deployChannel = async () => {
    await channelContractFactory
      .deploy({
        data: CHANEL_ARTIFACT.bytecode,
        arguments: [],
      })
      .send({
        from: account!,
      })
      .on("transactionHash", function (txHash) {
        console.log("txHash:", txHash);
      })
      .on("error", function (err) {
        console.log(err.message);
      })
      .on("receipt", async function (receipt) {
        setIsChannelDeployed(true);
        const address = receipt.contractAddress;
        setChannelAddr(address!);
        const txHash = receipt.transactionHash;
        console.log(txHash);
      });
  };

  const sendMessage = async () => {
    const channelContract = getContractInstance("channel", channelAddr);
    if (writeMsg == null) {
      return alert("msg is null");
    }

    const encryptToText = encryptTextToPk(toMail?.pk!, writeMsg);
    const encryptFromText = encryptTextToPk(fromMail?.pk!, writeMsg);

    const tx = await channelContract.methods
      .sendMsg(
        channelId,
        fromMail?.nft,
        fromMail?.tokenId!,
        encryptToText,
        encryptFromText
      )
      .send({ from: account });
    console.log(tx);
  };

  const getUserInfoByMailAddress = async (mailAddr: string) => {
    rootServerContractFactory.options.address = rootServerAddr;

    try {
      const addr = parseMailAddr(mailAddr);
      const result: MailAddressOwnerInfo | null =
        await rootServerContractFactory.methods
          .getUserInfoByMailAddress(addr.handler, addr.server)
          .call();
      return result;
    } catch (error: any) {
      console.log(error.message);
    }
    return null;
  };

  const parseMailAddr = (mailAddr: string) => {
    const handler = mailAddr.split("@")[0];
    const server = mailAddr.split("@")[1];
    return { handler, server };
  };

  const fetchFromMail = async () => {
    if (myObtainMailAddresses.length === 0) return;

    const myMailInfo = await getUserInfoByMailAddress(myObtainMailAddresses[0]);
    if (myMailInfo == null) {
      return setToMailAddrInputErr("from mail not exits.");
    }
    setFromMail(myMailInfo);
  };

  const [isChannelNotCreatedYet, setIsChannelNotCreatedYet] =
    useState<boolean>(false);

  const checkToMail = async () => {
    if (toMailAddr) {
      const toMailResult = await getUserInfoByMailAddress(toMailAddr);

      if (toMailResult == null) {
        setIllegalToMailInput(true);
        return setToMailAddrInputErr("email not exits.");
      }

      setIllegalToMailInput(false);
      setToMailAddrInputErr(undefined);

      setToMail(toMailResult);
      const channelId = await filterChannelFromUser(
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

  const filterChannelFromUser = async (fromAddr: HexStr, toAddr: HexStr) => {
    let channelId: string | undefined;

    const eventName = "CreateChannel";
    const topics = [null, [fromAddr, toAddr], [fromAddr, toAddr]];
    const events = await getContractEventLogs(
      channelAddr,
      CHANEL_ARTIFACT.abi,
      eventName,
      topics
    );

    if (events.length > 0) {
      channelId = events[0].returnValues.channelId;
    }

    return channelId;
  };

  const handleToMailAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToMailAddr(event.target.value);

    console.log("value is:", event.target.value);
  };

  const createChannelInMail = async () => {
    const serverName1 = parseMailAddr(myObtainMailAddresses[0]).server;
    const serverName2 = parseMailAddr(toMailAddr!).server;
    const nft1 = mailServers.filter((m) => m.name === serverName1)[0].address;
    const nft2 = mailServers.filter((m) => m.name === serverName2)[0].address;

    await createChannelByUser(
      nft1,
      nft2,
      account!,
      toMail?.owner!,
      fromMail?.tokenId!,
      toMail?.tokenId!
    );
  };

  const createChannelByUser = async (
    nft1: string,
    nft2: string,
    user1: string,
    user2: string,
    token1: string,
    token2: string
  ) => {
    const channelContract = getContractInstance("channel", channelAddr);
    const tx = await channelContract.methods
      .createChannel(nft1, nft2, user1, user2, token1, token2)
      .send({ from: user1 });
    console.log(tx);
  };

  useEffect(() => {
    fetchAllMailServers();
  }, []);

  useEffect(() => {
    if (account != null && mailServers.length > 0) {
      fetchMyObtainMailAddresses();
    }
  }, [account, mailServers]);

  useEffect(() => {
    findUserSentMailMsg();
    findUserReceiveMailMsg();
  }, [fromMail]);

  useEffect(() => {
    fetchFromMail();
  }, [myObtainMailAddresses]);

  return (
    <div style={styles.root}>
      <PopupSelectChainId />
      <Account
        accountCallback={setAccount}
        encryptionPublicKeyCallback={setEncryptPk}
      />
      <hr />
      <span className="block fixed">
        <Network></Network>
      </span>
      <hr />
      <Card hidden>
        <Text transform="capitalize">experiment feature: e2e im</Text>
        <Button onClick={deployChannel}>deploy channel</Button>
        {isChannelDeployed && (
          <Text transform="capitalize">address: {channelAddr}</Text>
        )}
        <Button onClick={deployMailToken}>deploy mail token</Button>
        mail token:{" "}
        {isMailTokenDeployed && (
          <div>
            <Text transform="capitalize">
              <a
                target={"_blank"}
                href={
                  "/subscribe?chain_id=" +
                  chainId +
                  "&contract=" +
                  mailServerAddr
                }
              >
                {mailServerAddr}
              </a>
            </Text>
          </div>
        )}
        <Button onClick={deployRootServer}>deploy root server</Button>
        root server:{" "}
        {isRootServerDeployed && (
          <Text transform="capitalize">
            <a
              target={"_blank"}
              href={
                "/subscribe?chain_id=" + chainId + "&contract=" + rootServerAddr
              }
            >
              {rootServerAddr}
            </a>
          </Text>
        )}
        <hr />
        <Button onClick={setServerName}>set server name for mail token</Button>
        <hr />
      </Card>

      <Card className="block fixed">
        <Text transform="capitalize">
          welcome to NaiveMail, we use ERC721 to enable full-onchain E2E
          messaging on L2 evm chain.
        </Text>
        <hr />
        <Grid container spacing={4} style={{ fontSize: "16px" }}>
          <Grid item xs={4}>
            All Servers {mailServerList}
            <button className="block inline" onClick={subscribeMail}>
              Register
            </button>
          </Grid>
          <Grid item xs={8}>
            Your Mails {myObtainMailAddressList}
          </Grid>
        </Grid>
      </Card>
      <Card className="block fixed">
        <Grid container spacing={4}>
          <Grid item xs={4} style={{ backgroundColor: "darkgray" }}>
            From
            <span className="block fixed inline" style={{ fontSize: "20px" }}>
              {myObtainMailAddresses.length > 0
                ? myObtainMailAddresses[0]
                : "No mail yet"}
            </span>{" "}
            <hr />
            <form style={{ marginBottom: "40px" }}>
              To{" "}
              <input
                onChange={handleToMailAddress}
                value={toMailAddr}
                onMouseLeave={checkToMail}
                style={{ fontSize: "20px", padding: "5px" }}
                className="block wrap inline"
                type="text"
              />
              {illegalToMailInput && toMailAddrInputErr}{" "}
              {isChannelNotCreatedYet && !illegalToMailInput && (
                <span>
                  <button
                    className="block inline"
                    type="button"
                    onClick={createChannelInMail}
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
            <hr />
            {myReceiveMailList}
            <hr />
            <span
              className="block fixed inline accent"
              style={{ fontSize: "20px" }}
            >
              Sent
            </span>{" "}
            <hr />
            {mySentMailList}
            <hr />
          </Grid>
        </Grid>
      </Card>

      <br />
      <br />
      <br />
      <br />
    </div>
  );
}
