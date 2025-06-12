const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LottoCount Contract", function () {
  let LottoCount, lotto, owner, addr1, addr2;

  beforeEach(async function () {
    LottoCount = await ethers.getContractFactory("LottoCount");
    [owner, addr1, addr2] = await ethers.getSigners();
    lotto = await LottoCount.deploy();
  });

  it("Should deploy with correct initial values", async function () {
    expect(await lotto.ticketPrice()).to.equal(ethers.parseEther("0.0101"));
    expect(await lotto.lottoIndex()).to.equal(1);
    expect(await lotto.getBalance()).to.equal(0);
  });

  it("Should not allow non-owner to withdraw funds", async function () {
    await expect(lotto.connect(addr1).withdraw()).to.be.revertedWithoutReason();
  });

  it("Should allow users to buy tickets", async function () {
    await lotto.connect(addr1).AddTicket({ value: ethers.parseEther("0.0101") });
    expect(await lotto.numtickets()).to.equal(1);
    expect(await lotto.totalBounty()).to.equal(ethers.parseEther("0.0101"));
  });

  it("Should revert if ticket price is incorrect", async function () {
    await expect(lotto.connect(addr1).AddTicket({ value: ethers.parseEther("0.01") })).to.be.revertedWithoutReason();
  });

  it("Should update last ticket time on ticket purchase", async function () {
    const tx = await lotto.connect(addr1).AddTicket({ value: ethers.parseEther("0.0101") });
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);

    expect(await lotto.getLastTicketTime()).to.equal(block.timestamp);
  });
});
