// Tests the NFT can be claimed back if no bids occur

const MyNFT = artifacts.require("MyNFT");
let ERC721 = artifacts.require("RemintingNFT");

contract("MyNFT", (accounts) => {
  it("should handle NFTs with variadic IDs", async () => {
    let instance = await MyNFT.new();
    ERC721 = await ERC721.new("", "");

    let token = 100;
    await ERC721._mint(100, { from: accounts[1] });
    await ERC721.approve(instance.address, 100, { from: accounts[1] });

    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, 100, web3.utils.toWei("1"),
                          5, "0x0000000000000000000000000000000000000000",
                          false, { from: accounts[1] }
                       );

    let listing = await instance.getListing.call(0);
    assert.strictEqual(listing.token.toString(), "101");
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp], id: null
    }, () => resolve()));

    await instance.finish(0, { from: accounts[1] });
    assert.strictEqual((await instance.getListing.call(0)).paidOut, true);

    // Wrapper try/catches are due to the old token ID no longer existing so the contract errors
    // Really a sanity check on the ID rework
    try {
      await ERC721.ownerOf.call(100);
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "success");
    }
    try {
      await ERC721.ownerOf.call(101);
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
    assert.strictEqual(await ERC721.ownerOf.call(102), accounts[1]);
  });
});
