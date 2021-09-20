// Tests the NFT can be claimed back if no bids occur

const MyNFT = artifacts.require("MyNFT");
let ERC721 = artifacts.require("ERC721");

contract("MyNFT", (accounts) => {
  it("should return the NFT if no bids occur", async () => {
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

    let listing = await instance.getListing.call(0);
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp], id: null
    }, () => resolve()));

    let finish = await instance.finish(0, { from: accounts[1] });

    finish = finish.logs;
    assert.strictEqual(finish.length, 1);
    finish = finish[0];
    assert.strictEqual(finish.event, "AuctionFinished");
    finish = finish.args;
    assert.strictEqual(finish.id.toString(), "0");
    assert.strictEqual(finish.nftRecipient, accounts[1]);
    assert.strictEqual(finish.price.toString(), "0");

    assert.strictEqual((await instance.getListing.call(0)).paidOut, true);
    assert.strictEqual(await ERC721.ownerOf.call(token), accounts[1]);
  });
});
