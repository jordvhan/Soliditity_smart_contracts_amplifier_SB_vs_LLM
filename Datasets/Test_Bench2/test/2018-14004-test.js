const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Globecoin Contract", function () {
  let Globecoin, globecoin, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const GlobecoinFactory = await ethers.getContractFactory("Globecoin");
    globecoin = await GlobecoinFactory.deploy();
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await globecoin.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("0.000000014"));
  });

  it("Should assign initial balances correctly", async function () {
    const ownerBalance = await globecoin.balanceOf(owner.address);
    expect(ownerBalance).to.be.above(0);
  });

  it("Should transfer tokens correctly", async function () {
    const transferAmount = ethers.parseEther("0.00000000000001");
    await globecoin.transfer(addr1.address, transferAmount);
    const addr1Balance = await globecoin.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
  });

  it("Should fail transfer if balance is insufficient", async function () {
    const transferAmount = ethers.parseEther("100");
    await expect(
      globecoin.connect(addr1).transfer(addr2.address, transferAmount)
    ).to.be.revertedWithoutReason();
  });

  it("Should approve and allow transferFrom", async function () {
    const approveAmount = ethers.parseEther("0.000000000000005");
    await globecoin.approve(addr1.address, approveAmount);
    const allowance = await globecoin.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(approveAmount);

    await globecoin
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, approveAmount);
    const addr2Balance = await globecoin.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(approveAmount);
  });

  it("Should NOT fail if non-owner tries to update variables", async function () {
    await expect(
      globecoin.connect(addr1).developer_new_price("$2.0 per GLB")
    ).to.not.reverted;
  });

  it("Should distribute tokens to multiple addresses", async function () {
    const addresses = [addr1.address, addr2.address];
    await globecoin.distribute_100_tokens_to_many(addresses);
    const addr1Balance = await globecoin.balanceOf(addr1.address);
    const addr2Balance = await globecoin.balanceOf(addr2.address);
    expect(addr1Balance).to.equal(ethers.parseEther("0.0000000000001"));
    expect(addr2Balance).to.equal(ethers.parseEther("0.0000000000001"));
  });

  it("Should transfer tokens to multiple addresses after ICO", async function () {
    const addresses = [addr1.address, addr2.address];
    const transferAmount = ethers.parseEther("0.000000000000005");
    await globecoin.transfer_tokens_after_ICO(addresses, transferAmount);
    const addr1Balance = await globecoin.balanceOf(addr1.address);
    const addr2Balance = await globecoin.balanceOf(addr2.address);
    expect(addr1Balance).to.equal(transferAmount);
    expect(addr2Balance).to.equal(transferAmount);
  });

  it("Should transfer tokens to multiple addresses after ICO - zero value", async function () {
    const addresses = [addr1.address, addr2.address];
    const transferAmount = ethers.parseEther("0");
    await globecoin.transfer_tokens_after_ICO(addresses, transferAmount);
    const addr1Balance = await globecoin.balanceOf(addr1.address);
    const addr2Balance = await globecoin.balanceOf(addr2.address);
    expect(addr1Balance).to.equal(transferAmount);
    expect(addr2Balance).to.equal(transferAmount);
  });

  it("Should not allow non-owner to change coin character", async function () {
    const newCoinCharacter = "New Coin Character";
    await globecoin.connect(addr1).developer_Coin_Character(newCoinCharacter);
    expect(await globecoin.Coin_Character()).to.not.equal(newCoinCharacter);
  });

  it("Should not allow non-owner to add exchanges", async function () {
    const newExchanges = "New Exchange";
    await globecoin.connect(addr1).developer_add_Exchanges(newExchanges);
    expect(await globecoin.Exchanges()).to.not.equal(newExchanges);
  });

  it("Should not allow non-owner to add cost of transfers", async function () {
    const newCostOfTransfers = "New Cost";
    await globecoin.connect(addr1).developer_add_cost_of_transfers(newCostOfTransfers);
    expect(await globecoin.cost_of_transfers()).to.not.equal(newCostOfTransfers);
  });

  it("Should not allow non-owner to change the price", async function () {
    const newPrice = "$2.0";
    await globecoin.connect(addr1).developer_new_price(newPrice);
    expect(await globecoin.price()).to.not.equal(newPrice);
  });

  it("Should not allow non-owner to change the crowdsale text", async function () {
    const newCrowdsaleText = "New Crowdsale Text";
    await globecoin.connect(addr1).developer_crowdsale_text(newCrowdsaleText);
    expect(await globecoin.crowdsale()).to.not.equal(newCrowdsaleText);
  });

  it("Should not allow non-owner to change the symbol", async function () {
    const newSymbol = "NEW";
    await globecoin.connect(addr1).developer_new_symbol(newSymbol);
    expect(await globecoin.symbol()).to.not.equal(newSymbol);
  });

  // it("Should handle fallback function with zero ether", async function () {
  //   const initialBalance = await globecoin.balanceOf(addr1.address);
  //   await addr1.sendTransaction({
  //       to: await globecoin.getAddress(),
  //       value: 0
  //   });
  //   const newBalance = await globecoin.balanceOf(addr1.address);
  //   expect(newBalance).to.equal(initialBalance);
  // });
});
