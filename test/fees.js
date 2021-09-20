// Tests that fees are properly paid out in all cases
// The success test already verifies the owner gets 4% when no referrer/marketplace is set
// Account 0 is owner, 1 is creator, 2 is bidder, 3 is referrer, 4 is marketplace

const MyNFT = artifacts.require("MyNFT");
let ERC721 = artifacts.require("ERC721");

contract("MyNFT", (accounts) => {
  it("should pay out the referrer", async () => {
    let instance = await MyNFT.new();
    ERC721 = await ERC721.new("", "");

    let token = 100;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(instance.address, token, { from: accounts[1] });

    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"),
                          5, accounts[3], false, { from: accounts[1] }
                       );

    await instance.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2], value: await instance.getNextBid.call(0) });

    let ownerBalance = await web3.eth.getBalance(accounts[0]);
    let referrerBalance = await web3.eth.getBalance(accounts[3]);
    // Sanity check they're different; means that crossed wires don't have a chance of not being detected
    assert.notStrictEqual(ownerBalance, referrerBalance);

    // Finish
    let listing = await instance.getListing.call(0);
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp],
      id: null
    }, () => resolve()));
    await instance.finish(0, { from: accounts[2] });

    assert.strictEqual((await instance.balanceOf(accounts[0])).toString(), web3.utils.toWei("0.02"));
    await instance.withdraw(accounts[0], { from: accounts[9] });
    assert.strictEqual((await instance.balanceOf(accounts[3])).toString(), web3.utils.toWei("0.02"));
    await instance.withdraw(accounts[3], { from: accounts[9] });

    assert.strictEqual(
      (await web3.eth.getBalance(accounts[0])).toString(),
      (new web3.utils.BN(ownerBalance)).add(new web3.utils.BN(web3.utils.toWei("0.02"))).toString()
    );
    assert.strictEqual(
      (await web3.eth.getBalance(accounts[3])).toString(),
      (new web3.utils.BN(referrerBalance)).add(new web3.utils.BN(web3.utils.toWei("0.02"))).toString()
    );
  });

  it("should pay out the marketplace", async () => {
    let instance = await MyNFT.new();

    let token = 101;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(instance.address, token, { from: accounts[1] });

    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"), 5,
                          "0x0000000000000000000000000000000000000000", true,
                          { from: accounts[1] }
                       );

    await instance.bid(0, accounts[4], { from: accounts[2], value: await instance.getNextBid.call(0) });

    let ownerBalance = await web3.eth.getBalance(accounts[0]);
    let marketplaceBalance = await web3.eth.getBalance(accounts[4]);
    assert.notStrictEqual(ownerBalance, marketplaceBalance);

    // Finish
    let listing = await instance.getListing.call(0);
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp],
      id: null
    }, () => resolve()));
    await instance.finish(0, { from: accounts[2] });

    assert.strictEqual((await instance.balanceOf(accounts[0])).toString(), web3.utils.toWei("0.02"));
    await instance.withdraw(accounts[0], { from: accounts[9] });
    assert.strictEqual((await instance.balanceOf(accounts[4])).toString(), web3.utils.toWei("0.02"));
    await instance.withdraw(accounts[4], { from: accounts[9] });

    assert.strictEqual(
      (await web3.eth.getBalance(accounts[0])).toString(),
      (new web3.utils.BN(ownerBalance)).add(new web3.utils.BN(web3.utils.toWei("0.02"))).toString()
    );
    assert.strictEqual(
      (await web3.eth.getBalance(accounts[4])).toString(),
      (new web3.utils.BN(marketplaceBalance)).add(new web3.utils.BN(web3.utils.toWei("0.02"))).toString()
    );
  });

  it("should pay out the referrer and the marketplace", async () => {
    let instance = await MyNFT.new();

    let token = 102;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(instance.address, token, { from: accounts[1] });

    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"),
                          5, accounts[3], true, { from: accounts[1] }
                       );

    await instance.bid(0, accounts[4], { from: accounts[2], value: await instance.getNextBid.call(0) });

    // Do a junk action from the marketplace to create different balances
    await ERC721._mint(103, { from: accounts[4] });
    await ERC721.approve(instance.address, 103, { from: accounts[4] });
    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, 103, web3.utils.toWei("1"), 5,
                          "0x0000000000000000000000000000000000000000", false,
                          { from: accounts[4] }
                       );

    let ownerBalance = await web3.eth.getBalance(accounts[0]);
    let referrerBalance = await web3.eth.getBalance(accounts[3]);
    let marketplaceBalance = await web3.eth.getBalance(accounts[4]);
    assert.notStrictEqual(ownerBalance, referrerBalance);
    assert.notStrictEqual(ownerBalance, marketplaceBalance);
    assert.notStrictEqual(referrerBalance, marketplaceBalance);

    let listing = await instance.getListing.call(0);
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp],
      id: null
    }, () => resolve()));
    await instance.finish(0, { from: accounts[2] });

    assert.strictEqual((await instance.balanceOf(accounts[0])).toString(), web3.utils.toWei("0.02"));
    await instance.withdraw(accounts[0], { from: accounts[9] });
    assert.strictEqual((await instance.balanceOf(accounts[3])).toString(), web3.utils.toWei("0.01"));
    await instance.withdraw(accounts[3], { from: accounts[9] });
    assert.strictEqual((await instance.balanceOf(accounts[4])).toString(), web3.utils.toWei("0.01"));
    await instance.withdraw(accounts[4], { from: accounts[9] });

    assert.strictEqual(
      (await web3.eth.getBalance(accounts[0])).toString(),
      (new web3.utils.BN(ownerBalance)).add(new web3.utils.BN(web3.utils.toWei("0.02"))).toString()
    );
    assert.strictEqual(
      (await web3.eth.getBalance(accounts[3])).toString(),
      (new web3.utils.BN(referrerBalance)).add(new web3.utils.BN(web3.utils.toWei("0.01"))).toString()
    );
    assert.strictEqual(
      (await web3.eth.getBalance(accounts[4])).toString(),
      (new web3.utils.BN(marketplaceBalance)).add(new web3.utils.BN(web3.utils.toWei("0.01"))).toString()
    );
  });
});
