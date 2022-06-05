import { expect } from "chai";
import { ethers } from "hardhat";
import { NaiveFriends721 } from "../typechain";

let myToken: NaiveFriends721;
const tokenPrice = ethers.utils.parseEther("0.1"); // 0.1 eth
const lowOffer = ethers.utils.parseEther("0.01"); // 0.1 eth
const highWithdrawAmount = ethers.utils.parseEther("1"); // 1 eth

describe("NaiveFriends721", function () {
  before(async function () {
    // runs once before the first test in this block
    const [owner] = await ethers.getSigners();
    const token = await ethers.getContractFactory("NaiveFriends721");
    myToken = await token.deploy(tokenPrice, owner.address);
    await myToken.deployed();
  });

  it("Should return the right name and symbol for the erc721 token", async function () {
    expect(await myToken.name()).to.equal("NaiveFriends721");
    expect(await myToken.symbol()).to.equal("RAHF");
  });

  it("Should mint two token", async function name() {
    const [owner] = await ethers.getSigners();

    // mint first token
    {
      const mintTx = await myToken.mint(owner.address, { value: tokenPrice });

      // wait until the transaction is mined
      await mintTx.wait();
      const tokenId = await myToken.balanceOf(owner.address);
      const tokenURI = await myToken.tokenURI(tokenId);
      expect(tokenId).to.equal(1);
      expect(tokenURI.slice(0, 2)).to.equal("0x");
      expect(tokenURI.length).to.equal(66);
    }

    // mint second token
    {
      const mintTx = await myToken.mint(owner.address, { value: tokenPrice });

      // wait until the transaction is mined
      await mintTx.wait();
      const tokenId = await myToken.balanceOf(owner.address);
      const tokenURI = await myToken.tokenURI(tokenId);
      expect(tokenId).to.equal(2);
      expect(tokenURI.slice(0, 2)).to.equal("0x");
      expect(tokenURI.length).to.equal(66);
    }

    // failed mint token with offer lower tokenPrice
    await expect(
      myToken.mint(owner.address, { value: lowOffer })
    ).to.be.revertedWith(
      "InsufficientOffer(100000000000000000, 10000000000000000)"
    );
  });

  it("Should withdraw funds to admin", async function name() {
    const [owner, account1] = await ethers.getSigners();

    // withdraw one tokenPrice amount fund from contract
    {
      const balanceBefore = await owner.getBalance();
      const mintTx = await myToken.withdraw(tokenPrice);

      // wait until the transaction is mined
      await mintTx.wait();

      const balanceAfter = await owner.getBalance();

      expect(balanceAfter.sub(balanceBefore).isZero()).to.equal(false);
    }

    // withdraw more than fund balance from contract
    await expect(myToken.withdraw(highWithdrawAmount)).to.be.revertedWith(
      `InsufficientPoolBalance(100000000000000000, 1000000000000000000)`
    );

    // withdraw with different address
    // todo: const expectRevertMsg = `AdminOnly(${owner.address}, ${account1.address})`.replace(/\"/g, '');
    await expect(
      myToken.connect(account1).withdraw(highWithdrawAmount)
    ).to.be.revertedWith("AdminOnly");
  });

  it("Should set encryptPublicKey", async function name() {
    const account1 = (await ethers.getSigners())[1];
    const tokenId = "1";
    const notExistTokenId = "0";
    const expectedEncryptPubKey =
      "Dh7qRLQ2UTj7K8V1VH3BTNl6gj3vYeIwC1ZccpVKn38=";

    // withdraw one tokenPrice amount fund from contract
    {
      const setTx = await myToken.setEncryptPublicKey(
        tokenId,
        expectedEncryptPubKey
      );
      // wait until the transaction is mined
      await setTx.wait();
      const pubKey = await myToken.encryptPublicKeys(tokenId);
      expect(pubKey).to.equal(expectedEncryptPubKey);
    }

    // setEncryptPublicKey with different address, not owner
    await expect(
      myToken
        .connect(account1)
        .setEncryptPublicKey(tokenId, expectedEncryptPubKey)
    ).to.be.revertedWith("OwnerOnly");

    // setEncryptPublicKey with not exist tokenId
    await expect(
      myToken
        .connect(account1)
        .setEncryptPublicKey(notExistTokenId, expectedEncryptPubKey)
    ).to.be.revertedWith("ERC721: operator query for nonexistent token");

    // fetch encryptPublicKey by getStorageAt
    const encryptPublicKeyMappingSlot = 10; // get this value from artifacts/build-info/xxx.json output.contract.storageLayout
    const position = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [tokenId, encryptPublicKeyMappingSlot]
    );
    const posValue = await ethers.provider.getStorageAt(
      myToken.address,
      position
    );

    // encryptPublicKey should be a long string: over 32 bytes
    const isEven = (BigInt(posValue) % BigInt(2)).toString() === "0";
    expect(isEven).to.equal(false);

    const stringByteLen = parseInt(
      ((BigInt(posValue) - BigInt(1)) / BigInt(2)).toString(10)
    );
    const slotLen = Math.ceil(stringByteLen / 32);
    let fullString = "0x";
    const pos = ethers.utils.keccak256(position);
    for (let i = 0; i < slotLen; i++) {
      const subStrPos = "0x" + (BigInt(pos) + BigInt(i)).toString(16);
      const subString = await ethers.provider.getStorageAt(
        myToken.address,
        subStrPos
      );
      fullString += subString.slice(2);
    }
    const decodePk = Buffer.from(
      fullString.slice(2, stringByteLen * 2 + 2),
      "hex"
    ).toString("utf-8");
    expect(decodePk).to.equal(expectedEncryptPubKey);
  });
});
