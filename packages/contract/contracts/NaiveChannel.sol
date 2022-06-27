//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./NaiveFriends721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

struct Channel {
    // readonly
    address nft1; // NFT contract
    address nft2; // NFT contract
    uint256 token1; // tokenId
    uint256 token2; // tokenId
    bool muteToken1;
    bool muteToken2;
    // writable
    // todo: limit length
    string msg1;
    string msg2;
}

contract NaiveChannel {
    mapping(uint256 => Channel) public channelById;
    using Counters for Counters.Counter;
    Counters.Counter private _channelIds;

    error wrongTokenOwner(address nft, address user, uint256 tokenId);
    error wrongChannel(uint256 channelId);
    error wrongSideChannel(uint256 channelId);

    event CreateChannel(
        uint256 indexed channelId,
        address indexed user1,
        address indexed user2
    );
    event NewMessage(
        uint256 indexed channelId,
        address indexed toNotifyUser,
        string msg
    );
    event SentMessage(
        uint256 indexed channelId,
        address indexed sentFromUser,
        string msg
    );

    constructor() {}

    function createChannel(
        address nft1,
        address nft2,
        address user1,
        address user2,
        uint256 tokenId1,
        uint256 tokenId2
    ) public returns (uint256 channelId) {
        checkOwnerOfToken(nft1, user1, tokenId1);
        checkOwnerOfToken(nft2, user2, tokenId2);

        Channel memory channel = Channel(
            nft1,
            nft2,
            tokenId1,
            tokenId2,
            false,
            false,
            "",
            ""
        );
        _channelIds.increment();
        uint256 id = _channelIds.current();
        channelById[id] = channel;

        emit CreateChannel(id, user1, user2);
        return id;
    }

    function sendMsg(
        uint256 channelId,
        address nft,
        uint256 tokenId, // sender's nft token id
        string memory encryptToMsg, // msg encrypted to receiver
        string memory encryptFromMsg // msg encrypted to sender
    ) public {
        Channel storage channel = channelById[channelId];
        if (tokenId != channel.token1 && tokenId != channel.token2) {
            revert wrongChannel(channelId);
        }
        if (nft != channel.nft1 && nft != channel.nft2) {
            revert wrongChannel(channelId);
        }

        if (nft == channel.nft1 && tokenId == channel.token1) {
            checkOwnerOfToken(channel.nft1, address(msg.sender), tokenId);

            // overwirte new message;
            channel.msg1 = encryptToMsg;
            NaiveFriends721 nf2 = NaiveFriends721(channel.nft2);
            address toNotifyUser = nf2.ownerOf(channel.token2);
            emit NewMessage(channelId, toNotifyUser, encryptToMsg);
            emit SentMessage(channelId, msg.sender, encryptFromMsg);
            return;
        }

        if (nft == channel.nft2 && tokenId == channel.token2) {
            checkOwnerOfToken(channel.nft2, address(msg.sender), tokenId);

            // overwirte new message;
            channel.msg2 = encryptToMsg;
            NaiveFriends721 nf1 = NaiveFriends721(channel.nft1);
            address toNotifyUser = nf1.ownerOf(channel.token1);
            emit NewMessage(channelId, toNotifyUser, encryptToMsg);
            emit SentMessage(channelId, msg.sender, encryptFromMsg);
            return;
        }

        // wrong side
        revert wrongSideChannel(channelId);
    }

    // read newest one msg, history msg can be read from event log
    // note: no auth check
    function readMsg(
        uint256 channelId,
        uint256 tokenId // reader's nft token id
    ) public view returns (string memory encryptText) {
        Channel memory channel = channelById[channelId];
        if (tokenId != channel.token1 && tokenId != channel.token2) {
            revert wrongChannel(channelId);
        }

        if (tokenId == channel.token1) {
            return channel.msg2;
        }
        if (tokenId == channel.token2) {
            return channel.msg1;
        }
    }

    function checkOwnerOfToken(
        address nft,
        address _owner,
        uint256 tokenId
    ) public view {
        NaiveFriends721 nf = NaiveFriends721(nft);
        address owner = nf.ownerOf(tokenId);
        require(_owner == owner, "worng token owner");
    }
}
