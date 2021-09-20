// Tests that old auctions can't be bid on, auctions can't be finished early, and that the time extension works properly

const MyNFT = artifacts.require("MyNFT");
let ERC721 = artifacts.require("ERC721");

contract("MyNFT", (accounts) => {
  it("shouldn't allow finishing before the auction ends", async () => {
    let instance = await MyNFT.new();
    ERC721 = await ERC721.new("", "");

    let token = 100;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(instance.address, token, { from: accounts[1] });
    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"),
                          5, "0x0000000000000000000000000000000000000000",
                          false, { from: accounts[1] }
                       );

    try {
      await instance.finish(0);
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("shouldn't allow bidding after the auction ends", async () => {
    let instance = await MyNFT.new();

    let token = 101;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(instance.address, token, { from: accounts[1] });
    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"),
                          5, "0x0000000000000000000000000000000000000000",
                          false, { from: accounts[1] }
                       );

    let listing = await instance.getListing.call(0);
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp],
      id: null
    }, () => resolve()));

    try {
      await instance.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2], value: await instance.getNextBid.call(0) });
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("should extend the time if a last minute bid occurs", async () => {
    let instance = await MyNFT.new();

    let token = 102;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(instance.address, token, { from: accounts[1] });
    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"),
                          5, "0x0000000000000000000000000000000000000000",
                          false, { from: accounts[1] }
                       );

    let listing = await instance.getListing.call(0);
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp - 30],
      id: null
    }, () => resolve()));

    let bid = await instance.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2], value: await instance.getNextBid.call(0) });
    // It should raise three minutes from time of bid
    // With 30 seconds remaining in the auction, a 2 minute raise is a quality check
    assert((listing.endTime + 120) < (await instance.getListing.call(0)).endTime);
  });
});
