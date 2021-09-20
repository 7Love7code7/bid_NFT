// Tests general flow and price unit calculation with 0/2/4/8/18 decimals

let MyNFT = artifacts.require("MyNFT");
const ERC20 = artifacts.require("ERC20");
let ERC721 = artifacts.require("ERC721");

// Basic ERC20 with 18 decimals
let erc20;

contract("MyNFT", (accounts) => {
  it("should support listings with an erc20", async () => {
    MyNFT = await MyNFT.deployed();
    erc20 = await ERC20.new(18);
    ERC721 = await ERC721.new("", "");

    let token = 100;
    await ERC721._mint(token, { from: accounts[1] });
    await ERC721.approve(MyNFT.address, token, { from: accounts[1] });

    let listing = await MyNFT.list(erc20.address, ERC721.address, token, web3.utils.toWei("1"),
                                      5, "0x0000000000000000000000000000000000000000",
                                      false, { from: accounts[1] }
                                   );

    assert.strictEqual(listing.logs[0].args.currency, erc20.address);
  });

  it("should allow bidding with an erc20", async () => {
    await erc20._mint(web3.utils.toWei("5"), { from: accounts[2] });
    await erc20.approve(MyNFT.address, await MyNFT.getNextBid.call(0), { from: accounts[2] });
    let bid = await MyNFT.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2] });

    // Ensure the contract has the correct balance
    assert.strictEqual((await erc20.balanceOf.call(MyNFT.address)).toString(), web3.utils.toWei("1"));
    assert.strictEqual((await erc20.balanceOf.call(accounts[2])).toString(), web3.utils.toWei("4"));

    // Verify the listing still has the currency set
    let listing = await MyNFT.getListing.call(0);
    assert.strictEqual(listing.currency, erc20.address);

    // Verify a new bid pays back the old ERC20 bid
    await erc20._mint(web3.utils.toWei("3"), { from: accounts[3] });
    await erc20.approve(MyNFT.address, await MyNFT.getNextBid.call(0), { from: accounts[3] });
    await MyNFT.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[3] });
    assert.strictEqual((await erc20.balanceOf.call(accounts[2])).toString(), web3.utils.toWei("5"));
  });

  it("should allow finishing auctions", async () => {
    let listing = await MyNFT.getListing.call(0);
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp], id: null
    }, () => resolve()));

    let ownerBalance = new web3.utils.BN(await erc20.balanceOf.call(accounts[0]));
    let creatorBalance = new web3.utils.BN(await erc20.balanceOf.call(accounts[1]));

    await MyNFT.finish(0, { from: accounts[4] });

    // Ensure the ERC20 was transferred
    assert.strictEqual((await erc20.balanceOf.call(MyNFT.address)).toString(), "0");
    assert.strictEqual((await erc20.balanceOf.call(accounts[0])).toString(), ownerBalance.add(new web3.utils.BN(web3.utils.toWei("0.042"))).toString());
    assert.strictEqual((await erc20.balanceOf.call(accounts[1])).toString(), creatorBalance.add(new web3.utils.BN(web3.utils.toWei("1.008"))).toString());
  });

  it("should calculate the correct price unit for various ERC20s", async () => {
    // The following all don't fit into the decimal accuracy model by being naturally inaccurate
    // Because of that, use the finest toothed option possible
    assert.strictEqual((await MyNFT.getPriceUnit.call((await ERC20.new(0)).address)).toString(), "1");
    assert.strictEqual((await MyNFT.getPriceUnit.call((await ERC20.new(2)).address)).toString(), "1");
    assert.strictEqual((await MyNFT.getPriceUnit.call((await ERC20.new(4)).address)).toString(), "1");

    // The following should render with 0.0001
    assert.strictEqual((await MyNFT.getPriceUnit.call((await ERC20.new(8)).address)).toString(), "10000");
    assert.strictEqual((await MyNFT.getPriceUnit.call((await ERC20.new(18)).address)).toString(), "100000000000000");
  });
});
