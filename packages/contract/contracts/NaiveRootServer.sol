//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./NaiveMail.sol";

contract NaiveRootServer {
    //todo: filter illegal token
    mapping(string => address) public serverName; // server name => NaiveMail contract address
    mapping(string => bool) public isServerNameTaken;
    mapping(address => bool) public isMailServerAlreadyRegister;

    error MailMustBeContract(address mail);
    error MailMustBeNoMaxSupply(address mail);
    error ServerNameAlreadyTaken(string name);
    error ServerNameNotRegister(string name);
    error EmailAddressNotRegister(string mailAddr, string serverName);
    error EmailServerAlreadyRegister(address mail);

    event RegisterServerName(string name, address indexed mailServer);

    constructor() {}

    function setServerName(address mailContract, string memory name) public {
        if (!isContract(mailContract)) {
            revert MailMustBeContract(mailContract);
        }
        if (isMailServerAlreadyRegister[mailContract] == true) {
            revert EmailServerAlreadyRegister(mailContract);
        }

        NaiveMail mail = NaiveMail(mailContract);
        if (mail.maxSupply() != 0) {
            revert MailMustBeNoMaxSupply(mailContract);
        }
        if (isServerNameTaken[name] == true) {
            revert ServerNameAlreadyTaken(name);
        }

        isServerNameTaken[name] = true;
        serverName[name] = mailContract;

        emit RegisterServerName(name, mailContract);
    }

    function getUserInfoByMailAddress(
        string memory _emailAddr,
        string memory _serverName
    )
        public
        view
        returns (
            address nft,
            string memory pk,
            uint256 tokenId,
            address owner
        )
    {
        if (isServerNameTaken[_serverName] != true) {
            revert ServerNameNotRegister(_serverName);
        }

        address serverAddr = serverName[_serverName];
        NaiveMail mail = NaiveMail(serverAddr);

        if (mail.isEmailAddressTaken(_emailAddr) != true) {
            revert EmailAddressNotRegister(_emailAddr, _serverName);
        }

        // return user info
        tokenId = mail.emailAddressToId(_emailAddr);
        pk = mail.encryptPublicKeys(tokenId);
        owner = mail.ownerOf(tokenId);
        nft = serverAddr;
    }

    function isContract(address _address) public view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_address)
        }
        return (size > 0);
    }
}
