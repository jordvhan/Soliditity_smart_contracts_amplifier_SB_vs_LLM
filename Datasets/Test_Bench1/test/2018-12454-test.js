const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("simplelottery Contract", function () {
  let SimpleLottery, simpleLottery, developer, user1, user2;

  beforeEach(async function () {
    [developer, user1, user2] = await ethers.getSigners();
    const SimpleLotteryFactory = await ethers.getContractFactory("simplelottery");
    simpleLottery = await SimpleLotteryFactory.deploy();
  });

  it("should deploy the contract and set the developer", async function () {
    expect(await simpleLottery.getDeveloperAddress()).to.equal(developer.address);
  });

  it("should allow the developer to set betting conditions", async function () {
    await simpleLottery.setBettingCondition(500, ethers.parseEther("0.5"));
    expect(await simpleLottery.getMaxContenders()).to.equal(500);
    expect(await simpleLottery.getBettingPrice()).to.equal(ethers.parseEther("0.5"));
  });

it("should not allow non-developer to set betting conditions", async function () {
  // Store initial betting conditions before calling the function
  const initialArraysize = await simpleLottery.arraysize();  // Accessing the getter for arraysize
  const initialBettingprice = await simpleLottery.bettingprice();  // Accessing the getter for bettingprice

  // Attempt to set betting conditions as a non-developer (user1)
  await simpleLottery.connect(user1).setBettingCondition(500, ethers.parseEther("0.5"));

  // Check that the state variables haven't been modified
  const finalArraysize = await simpleLottery.arraysize();  // Accessing the getter for arraysize
  const finalBettingprice = await simpleLottery.bettingprice();  // Accessing the getter for bettingprice

  expect(initialArraysize).to.equal(finalArraysize);
  expect(initialBettingprice).to.equal(finalBettingprice);
});


  it("should allow users to add guesses by sending ether", async function () {
    await simpleLottery.connect(user1).addguess({ value: ethers.parseEther("1") });
    expect(await simpleLottery.getBalance()).to.equal(ethers.parseEther("1"));
  });

  it("should reject guesses with insufficient ether", async function () {
    await expect(
      simpleLottery.connect(user1).addguess({ value: ethers.parseEther("0.5") })
    ).to.be.reverted;
  });

  it("should finish the lottery and transfer prize to the winner", async function () {
    await simpleLottery.connect(user1).addguess({ value: ethers.parseEther("1") });
    await simpleLottery.connect(user2).addguess({ value: ethers.parseEther("1") });

    const initialBalance = await ethers.provider.getBalance(user1.address);
    await simpleLottery.finish();

    const finalBalance = await ethers.provider.getBalance(user1.address);
    expect(finalBalance).to.be.at.least(initialBalance);
  });

  it("should allow the developer to finish the lottery", async function () {
    await simpleLottery.connect(user1).addguess({ value: ethers.parseEther("1") });
    await simpleLottery.finish();
    expect(await simpleLottery.getBalance()).to.equal(0);
  });

  it("should not allow a non-developer to finish the lottery", async function () {
    await simpleLottery.connect(user1).addguess({ value: ethers.parseEther("1") });

    const balanceBefore = await simpleLottery.getBalance();
    const stateBefore = await simpleLottery.state();

    await simpleLottery.connect(user1).finish();

    const balanceAfter = await simpleLottery.getBalance();
    const stateAfter = await simpleLottery.state();

    expect(balanceAfter).to.equal(balanceBefore);
    expect(stateAfter).to.equal(stateBefore);
  });

  it("should emit events on finishing the lottery", async function () {
    await simpleLottery.connect(user1).addguess({ value: ethers.parseEther("1") });
    await expect(simpleLottery.finish())
      .to.emit(simpleLottery, "SentPrizeToWinner")
      .and.to.emit(simpleLottery, "SentDeveloperFee");
  });

  it("should return correct betting status", async function () {
    await simpleLottery.connect(user1).addguess({ value: ethers.parseEther("1") });
    const status = await simpleLottery.getBettingStatus();
    expect(status[0]).to.equal(0); // State.Started
    expect(status[3]).to.equal(1); // numguesses
    expect(status[5]).to.equal(ethers.parseEther("1")); // balance
  });
});
