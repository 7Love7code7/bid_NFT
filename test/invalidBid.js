const MyNFT = artifacts.require("MyNFT");
let ERC721 = artifacts.require("ERC721");

contract("MyNFT", (accounts) => {
  it("should verify the bid amount", async () => {
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

    // Too little
    try {
      await instance.bid(0, "0x0000000000000000000000000000000000000000", {
        from: accounts[2],
        value: (new web3.utils.BN(await instance.getNextBid.call(0))).sub(new web3.utils.BN(1))
      });
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }

    // Too much
    try {
      await instance.bid(0, "0x0000000000000000000000000000000000000000", {
        from: accounts[2],
        value: (new web3.utils.BN(await instance.getNextBid.call(0))).add(new web3.utils.BN(1))
      });
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("shouldn't allow marketplaces when not allowed", async () => {
    let instance = await MyNFT.new();

    let token = 101;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(instance.address, token, { from: accounts[1] });

    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"),
                          5, "0x0000000000000000000000000000000000000000",
                          false, { from: accounts[1] }
                       );

    try {
      await instance.bid(0, "0x0000000000000000000000000000000000000001", { from: accounts[2], value: await instance.getNextBid.call(0) });
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("shouldn't allow you to raise your own bid", async () => {
    let instance = await MyNFT.new();

    let token = 102;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(instance.address, token, { from: accounts[1] });

    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"),
                          5, "0x0000000000000000000000000000000000000000",
                          false, { from: accounts[1] }
                       );

    await instance.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2], value: await instance.getNextBid.call(0) });
    try {
      await instance.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2], value: await instance.getNextBid.call(0) });
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("shouldn't allow you to bid on non-existent auctions", async () => {
    let instance = await MyNFT.new();
    try {
      await instance.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2], value: await instance.getNextBid.call(0) });
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });
});
