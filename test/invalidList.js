// Test a variety of invalid calls to list

const MyNFT = artifacts.require("MyNFT");
let ERC721 = artifacts.require("ERC721");

contract("MyNFT", (accounts) => {
  it("shouldn't list auctions greater than 30 days", async () => {
    let instance = await MyNFT.new();
    ERC721 = await ERC721.new("", "");

    let token = 100;
    await ERC721._mint(token, { from: accounts[1] });
    try {
      await instance.list("0x0000000000000000000000000000000000000000",
                            ERC721.address, token, web3.utils.toWei("1"),
                            31, "0x0000000000000000000000000000000000000000",
                            false, { from: accounts[1] }
                         );
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("shouldn't list NFTs that aren't the senders", async () => {
    let instance = await MyNFT.new();
    // Created in the previous test
    let token = 100;

    // Random NFT
    try {
      await instance.list("0x0000000000000000000000000000000000000000",
                            ERC721.address, token, web3.utils.toWei("1"),
                            5, "0x0000000000000000000000000000000000000000",
                            false, { from: accounts[2] }
                         );
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }

    // Random NFT the contract can auction off yet was told to by someone else
    await ERC721.approve(instance.address, token, { from: accounts[1] });
    try {
      await instance.list("0x0000000000000000000000000000000000000000",
                            ERC721.address, token, web3.utils.toWei("1"),
                            5, "0x0000000000000000000000000000000000000000",
                            false, { from: accounts[2] }
                         );
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("shouldn't list with a price that will flatline getNextBid", async () => {
    let instance = await MyNFT.new();
    let token = 100;
    try {
      await instance.list("0x0000000000000000000000000000000000000000",
               ERC721.address, token, "1",
               5, "0x0000000000000000000000000000000000000000",
               false, { from: accounts[1] }
            );
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("shouldn't list with a price that isn't a multiple of the price unit", async () => {
    let instance = await MyNFT.new();
    let token = 100;
    try {
      await instance.list("0x0000000000000000000000000000000000000000",
               ERC721.address, token, web3.utils.toWei("0.00015"),
               5, "0x0000000000000000000000000000000000000000",
               false, { from: accounts[1] }
            );
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });

  it("shouldn't list listed NFTs", async () => {
    let instance = await MyNFT.new();
    let token = 100;
    await ERC721.approve(instance.address, token, { from: accounts[1] });
    await instance.list("0x0000000000000000000000000000000000000000",
                          ERC721.address, token, web3.utils.toWei("1"),
                          5, "0x0000000000000000000000000000000000000000",
                          false, { from: accounts[1] }
                       );
    try {
      await instance.list("0x0000000000000000000000000000000000000000",
                            ERC721.address, token, web3.utils.toWei("1"),
                            5, "0x0000000000000000000000000000000000000000",
                            false, { from: accounts[1] }
                         );
      throw "failure";
    } catch(e) {
      assert.notStrictEqual(e.toString(), "failure");
    }
  });
});
