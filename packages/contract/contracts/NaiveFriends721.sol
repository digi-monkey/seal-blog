//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract NaiveFriends721 is ERC721Enumerable {
    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 public tokenPrice;
    address public admin;
    string public adminEncryptPublicKey;
    string public baseUri;
    mapping(uint256 => string) public encryptPublicKeys; // tokenId => pk

    uint256 public maxSupply; // token id limit, number must be either 0 or >0. 0 means no limit. can not be changed after constructor
    uint256 public stopMintingCursor; // token id to stop minting, number must be either 0 or >0. 0 means no stop

    constructor(
        uint256 _tokenPrice,
        address _admin,
        string memory _pk,
        uint256 _maxSupply,
        uint256 _stopMintingCursor
    ) ERC721("NaiveFriends721", "NAF") {
        if (_tokenPrice < 0) {
            revert InvalidTokenPrice(_tokenPrice);
        }
        if (_maxSupply < 0) {
            revert InvalidMaxSupply(_maxSupply);
        }
        if (_stopMintingCursor < 0) {
            revert InvalidStopMintingCursor(_stopMintingCursor);
        }
        if (
            _stopMintingCursor > 0 &&
            _maxSupply > 0 &&
            _stopMintingCursor > _maxSupply
        ) {
            revert StopMintingCursorOutOfMaxSupply(
                _stopMintingCursor,
                _maxSupply
            );
        }

        tokenPrice = _tokenPrice;
        admin = _admin;
        adminEncryptPublicKey = _pk;
        maxSupply = _maxSupply;
        stopMintingCursor = _stopMintingCursor;
    }

    error AdminOnly(address admin, address caller);
    error OwnerOnly(uint256 tokenId, address caller);
    error InsufficientPoolBalance(uint256 balance, uint256 amount);
    error InsufficientOffer(uint256 price, uint256 offer);
    error InvalidTokenPrice(uint256 price);
    error InvalidMaxSupply(uint256 maxSupply);
    error InvalidStopMintingCursor(uint256 stopMintingCursor);
    error StopMintingCursorOutOfMaxSupply(
        uint256 stopMintingCursor,
        uint256 maxSupply
    );
    error StopMintingCursorOutOfTotalSupply(
        uint256 stopMintingCursor,
        uint256 totalSupply
    );
    error StopMinting(uint256 stopMintingCursor, uint256 nextTokenId);
    error MaxSupplyLimit(uint256 maxSupply, uint256 nextTokenId);

    function setPrice(uint256 price) public {
        if (msg.sender != admin) {
            revert AdminOnly(admin, msg.sender);
        }

        if (price < 0) {
            revert InvalidTokenPrice(price);
        }

        tokenPrice = price;
    }

    function setStopMintingCursor(uint256 _stopMintingCursor) public {
        if (msg.sender != admin) {
            revert AdminOnly(admin, msg.sender);
        }
        if (_stopMintingCursor < 0) {
            revert InvalidStopMintingCursor(_stopMintingCursor);
        }
        if (
            _stopMintingCursor > 0 &&
            maxSupply > 0 &&
            _stopMintingCursor > maxSupply
        ) {
            revert StopMintingCursorOutOfMaxSupply(
                _stopMintingCursor,
                maxSupply
            );
        }
        // setStopMintingCursor should not smaller than all token length already minted
        uint256 total = totalSupply();
        if (_stopMintingCursor > 0 && _stopMintingCursor < total) {
            revert StopMintingCursorOutOfTotalSupply(_stopMintingCursor, total);
        }

        stopMintingCursor = _stopMintingCursor;
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

    function setBaseURI(string memory _baseUri) public {
        if (msg.sender != admin) {
            revert AdminOnly(admin, msg.sender);
        }

        baseUri = _baseUri;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseUri;
    }

    function mint(address player) external payable returns (uint256) {
        if (msg.value < tokenPrice) {
            revert InsufficientOffer({price: tokenPrice, offer: msg.value});
        }

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        // check if stop minting
        if (stopMintingCursor > 0 && stopMintingCursor < tokenId) {
            revert StopMinting({
                stopMintingCursor: stopMintingCursor,
                nextTokenId: tokenId
            });
        }
        // check if reach max supply
        if (maxSupply > 0 && maxSupply < tokenId) {
            revert MaxSupplyLimit({maxSupply: maxSupply, nextTokenId: tokenId});
        }

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

        // check if stop minting
        if (stopMintingCursor > 0 && stopMintingCursor < tokenId) {
            revert StopMinting({
                stopMintingCursor: stopMintingCursor,
                nextTokenId: tokenId
            });
        }
        // check if reach max supply
        if (maxSupply > 0 && maxSupply < tokenId) {
            revert MaxSupplyLimit({maxSupply: maxSupply, nextTokenId: tokenId});
        }

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

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721URIStorage: URI query for nonexistent token"
        );

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.tokenURI(tokenId);
    }

    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI)
        internal
        virtual
    {
        require(
            _exists(tokenId),
            "ERC721URIStorage: URI set of nonexistent token"
        );
        _tokenURIs[tokenId] = _tokenURI;
    }

    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }
}
