//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract NaiveFriends721 is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 public tokenPrice;
    address public admin;
    string public adminEncryptPublicKey;
    mapping(uint256 => string) public encryptPublicKeys; // tokenId => pk

    constructor(
        uint256 _tokenPrice,
        address _admin,
        string memory _pk
    ) ERC721("NaiveFriends721", "RAHF") {
        tokenPrice = _tokenPrice;
        admin = _admin;
        adminEncryptPublicKey = _pk;
    }

    error AdminOnly(address admin, address caller);
    error OwnerOnly(uint256 tokenId, address caller);
    error InsufficientPoolBalance(uint256 balance, uint256 amount);
    error InsufficientOffer(uint256 price, uint256 offer);
    error InvalidTokenPrice(uint256 price);

    function setPrice(uint256 price) public {
        if (msg.sender != admin) {
            revert AdminOnly(admin, msg.sender);
        }

        if (price <= 0) {
            revert InvalidTokenPrice(price);
        }

        tokenPrice = price;
    }

    function setAdminEncryptPublickKey(string memory _pk) public {
        if (msg.sender != admin) {
            revert AdminOnly(admin, msg.sender);
        }

        adminEncryptPublicKey = _pk;
    }

    function setAdmin(address _admin, string memory _pk) public {
        if (msg.sender != admin) {
            revert AdminOnly(admin, msg.sender);
        }

        admin = _admin;
        adminEncryptPublicKey = _pk;
    }

    function totalTokens() public view returns (uint256) {
        uint256 tokenId = _tokenIds.current();
        return tokenId;
    }

    function mint(address player) external payable returns (uint256) {
        if (msg.value < tokenPrice) {
            revert InsufficientOffer({price: tokenPrice, offer: msg.value});
        }

        _tokenIds.increment();

        uint256 tokenId = _tokenIds.current();
        _mint(player, tokenId);

        // generate random seed for tokenUri
        bytes32 blockHash = blockhash(block.number - 2);
        bytes32 seed = keccak256(
            abi.encodePacked(msg.sender, blockHash, tokenId)
        );
        string memory tokenUri = Strings.toHexString(uint256(seed));
        _setTokenURI(tokenId, tokenUri);

        console.log("minted, tokenId: %s, tokenUri: %s", tokenId, tokenUri);

        return tokenId;
    }

    function setEncryptPublicKey(uint256 tokenId, string memory key) public {
        if (!_isApprovedOrOwner(_msgSender(), tokenId)) {
            revert OwnerOnly({tokenId: tokenId, caller: _msgSender()});
        }

        encryptPublicKeys[tokenId] = key;
    }

    // subscribe = mint + setEncryptPk in one step
    function subscribe(address player, string memory key) external payable {
        if (msg.value < tokenPrice) {
            revert InsufficientOffer({price: tokenPrice, offer: msg.value});
        }

        _tokenIds.increment();

        uint256 tokenId = _tokenIds.current();
        _mint(player, tokenId);

        // generate random seed for tokenUri
        bytes32 blockHash = blockhash(block.number - 2);
        bytes32 seed = keccak256(
            abi.encodePacked(msg.sender, blockHash, tokenId)
        );
        string memory tokenUri = Strings.toHexString(uint256(seed));
        _setTokenURI(tokenId, tokenUri);

        console.log("minted, tokenId: %s, tokenUri: %s", tokenId, tokenUri);

        return setEncryptPublicKey(tokenId, key);
    }

    function withdraw(uint256 _amount) public {
        if (msg.sender != admin) {
            revert AdminOnly(admin, msg.sender);
        }

        if (_amount > address(this).balance) {
            revert InsufficientPoolBalance(address(this).balance, _amount);
        }

        payable(msg.sender).transfer(_amount);
    }
}
