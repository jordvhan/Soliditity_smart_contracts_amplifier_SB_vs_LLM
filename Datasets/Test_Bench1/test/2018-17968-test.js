const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RuletkaIo Contract", function () {
  let RuletkaIo, ruletkaIo, owner, addr1, addr2, addr3, addr4, addr5, addr6;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();
    const RuletkaIoFactory = await ethers.getContractFactory("RuletkaIo");
    ruletkaIo = await RuletkaIoFactory.deploy();
  });

  it("Should set the correct CTO and CEO on deployment", async function () {
    expect(await ruletkaIo.runner.address).to.equal(owner.address);
  });

  it("Should allow the CTO to create a room", async function () {
    await ruletkaIo.createRoom("Room 1", ethers.parseEther("1"));
    const room = await ruletkaIo.getRoom(1);
    expect(room.name).to.equal("Room 1");
    expect(room.entryPrice).to.equal(ethers.parseEther("1"));
  });

  it("Should allow players to enter a room", async function () {
    await ruletkaIo.createRoom("Room 1", ethers.parseEther("1"));
    await ruletkaIo.connect(addr1).enter(1, { value: ethers.parseEther("1") });
    const room = await ruletkaIo.getRoom(1);
    expect(room.players.length).to.equal(1);
    expect(room.players[0]).to.equal(addr1.address);
  });

  it("Should emit newPlayer event when a player enters a room", async function () {
    await ruletkaIo.createRoom("Room 1", ethers.parseEther("1"));
    await expect(ruletkaIo.connect(addr1).enter(1, { value: ethers.parseEther("1") }))
      .to.emit(ruletkaIo, "newPlayer")
      .withArgs(1, addr1.address);
  });

  it("Should allow the CTO to refund players in a room", async function () {
    await ruletkaIo.createRoom("Room 1", ethers.parseEther("1"));
    await ruletkaIo.connect(addr1).enter(1, { value: ethers.parseEther("1") });
    await ruletkaIo.connect(addr2).enter(1, { value: ethers.parseEther("1") });
    await expect(ruletkaIo.refundPlayersInRoom(1))
      .to.emit(ruletkaIo, "roomRefunded")
      .withArgs(1, [addr1.address, addr2.address]);
  });

  it("Should allow the CTO to set a new CTO", async function () {
    await ruletkaIo.setCTO(addr1.address);
    expect(await ruletkaIo.getCTO()).to.equal(addr1.address);
  });

  it("Should allow the CTO to set a new CEO", async function () {
    await ruletkaIo.setCEO(addr1.address);
    expect(await ruletkaIo.getCEO()).to.equal(addr1.address);
  });

  it("Should distribute funds correctly when a room is executed", async function () {
    await ruletkaIo.createRoom("Room 1", ethers.parseEther("1"));
    await ruletkaIo.connect(addr1).enter(1, { value: ethers.parseEther("1") });
    await ruletkaIo.connect(addr2).enter(1, { value: ethers.parseEther("1") });
    await ruletkaIo.connect(addr3).enter(1, { value: ethers.parseEther("1") });
    await ruletkaIo.connect(addr4).enter(1, { value: ethers.parseEther("1") });
    await ruletkaIo.connect(addr5).enter(1, { value: ethers.parseEther("1") });
    await ruletkaIo.connect(addr6).enter(1, { value: ethers.parseEther("1") });

    const room = await ruletkaIo.getRoom(1);
    expect(room.balance).to.equal(0); // Ensure funds are distributed
  });
});
