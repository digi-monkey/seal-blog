//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./NaiveFriends721.sol";

contract NaiveMail is NaiveFriends721 {
    //todo: filter illegal token
    mapping(string => uint256) public emailAddressToId; // emailAddress => token id
    mapping(string => bool) public isEmailAddressTaken;
    mapping(uint256 => bool) public isTokenAlreadyRegister;

    error EmaillAddressAlreadyToken(string emailAddress);

    event RegisterMailAddress(
        string indexed mailAddrIndex,
        uint256 indexed tokenId,
        address indexed initialOwner,
        string mailAddrStr
    );

    constructor(
        uint256 _tokenPrice,
        address _admin,
        string memory _pk,
        uint256 _maxSupply,
        uint256 _stopMintingCursor
    )
        NaiveFriends721(
            _tokenPrice,
            _admin,
            _pk,
            _maxSupply,
            _stopMintingCursor
        )
    {}

    function subscribeMail(
        address player,
        string memory key,
        string memory emailAddress
    ) public payable {
        uint256 tokenId = super.mint(player);
        super.setEncryptPublicKey(tokenId, key);
        setEmailAddress(tokenId, emailAddress);
    }

    function setEmailAddress(uint256 tokenId, string memory emailAddress)
        public
    {
        require(ownerOf(tokenId) == msg.sender, "only token owner");
        require(
            isTokenAlreadyRegister[tokenId] != true,
            "already register! only one chance"
        );

        if (isEmailAddressTaken[emailAddress] == true) {
            revert EmaillAddressAlreadyToken(emailAddress);
        }

        isTokenAlreadyRegister[tokenId] = true;
        isEmailAddressTaken[emailAddress] = true;
        emailAddressToId[emailAddress] = tokenId;

        emit RegisterMailAddress(
            emailAddress,
            tokenId,
            msg.sender,
            emailAddress
        );
    }
}
