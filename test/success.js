// Tests the standard flow and success path functionality, using ETH

let MyNFT = artifacts.require("MyNFT");
let ERC721 = artifacts.require("ERC721");

let listStartTime;

contract("MyNFT", (accounts) => {
  it("should set self to the owner", async () => {
    MyNFT = await MyNFT.new();
    assert.strictEqual(await MyNFT.owner.call(), accounts[0]);
  });

  it("should support listings", async () => {
    // New is called due to a lack of migration inclusion
    ERC721 = await ERC721.new("", "");
    let token = 100;
    await ERC721._mint(token, { from: accounts[1] });
    // Sanity check we own the token
    assert.strictEqual(await ERC721.ownerOf.call(token), accounts[1]);
    await ERC721.approve(MyNFT.address, token, { from: accounts[1] });

    let listing = await MyNFT.list("0x0000000000000000000000000000000000000000",
                                        ERC721.address, token, web3.utils.toWei("1"),
                                        5, "0x0000000000000000000000000000000000000000",
                                        false, { from: accounts[1] }
                                     );
    listStartTime = (await web3.eth.getBlock("latest")).timestamp;

    // Make sure the NFT was transferred
    assert.strictEqual(await ERC721.ownerOf.call(token), MyNFT.address);

    listing = listing.logs;
    assert.strictEqual(listing.length, 1);
    listing = listing[0];
    assert.strictEqual(listing.event, "ListingCreated");
    listing = listing.args;
    assert.strictEqual(listing.id.toString(), "0");
    assert.strictEqual(listing.currency, "0x0000000000000000000000000000000000000000");
    assert.strictEqual(listing.platform, ERC721.address);
    assert.strictEqual(listing.token.toString(), token.toString());
    assert.strictEqual(listing.price.toString(), web3.utils.toWei("1").toString());
    assert.strictEqual(listing.timeInDays.toString(), "5");
    assert.strictEqual(listing.referrer, "0x0000000000000000000000000000000000000000");

    // Make sure a new listing uses a new ID
    token = 101;
    await ERC721._mint(token, { from: accounts[2] });
    await ERC721.approve(MyNFT.address, token, { from: accounts[2] });
    assert.strictEqual((await MyNFT.list("0x0000000000000000000000000000000000000000",
                                              ERC721.address, token, web3.utils.toWei("1"),
                                              5, "0x0000000000000000000000000000000000000000",
                                              false, { from: accounts[2] }
                                           )
                       ).logs[0].args.id.toString(), "1");
  });

  it("should allow bidding", async () => {
    let bid = await MyNFT.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2], value: await MyNFT.getNextBid.call(0) });
    // Ensure the contract has the ETH
    assert.strictEqual((await web3.eth.getBalance(MyNFT.address)).toString(), web3.utils.toWei("1"));

    // Verify the bid
    bid = bid.logs;
    assert.strictEqual(bid.length, 1);
    bid = bid[0];
    assert.strictEqual(bid.event, "Bid");
    bid = bid.args;
    assert.strictEqual(bid.id.toString(), "0");
    assert.strictEqual(bid.bidder, accounts[2]);
    assert.strictEqual(bid.price.toString(), web3.utils.toWei("1"));

    // Verify the listing was updated accordingly
    let listing = await MyNFT.getListing.call(0);
    let endTime = listStartTime + 5 * 24 * 60 * 60;
    assert.strictEqual(listing.creator, accounts[1]);
    assert.strictEqual(listing.currency, "0x0000000000000000000000000000000000000000");
    assert.strictEqual(listing.platform, ERC721.address);
    assert.strictEqual(listing.token.toString(), "100");
    assert.strictEqual(listing.price, web3.utils.toWei("1"));
    assert.strictEqual(listing.referrer, "0x0000000000000000000000000000000000000000");
    assert.strictEqual(listing.allowMarketplace, false);
    assert.strictEqual(listing.marketplace, "0x0000000000000000000000000000000000000000");
    assert.strictEqual(listing.highBidder, accounts[2]);
    assert.strictEqual(+listing.endTime, endTime);
    assert.strictEqual(listing.paidOut, false);

    let oldBalance = new web3.utils.BN(await web3.eth.getBalance(accounts[2]));
    await MyNFT.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[3], value: (await MyNFT.getNextBid.call(0)) });
    assert.strictEqual((await web3.eth.getBalance(MyNFT.address)).toString(), web3.utils.toWei("2.05"));

    // Make sure the first bidder was paid back
    assert.strictEqual((await MyNFT.balanceOf(accounts[2])).toString(), web3.utils.toWei("1"));
    await MyNFT.withdraw(accounts[2], { from: accounts[9] });
    assert.strictEqual((await web3.eth.getBalance(accounts[2])).toString(), oldBalance.add(new web3.utils.BN(web3.utils.toWei("1"))).toString());

    await MyNFT.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[2], value: (await MyNFT.getNextBid.call(0)) });
    assert.strictEqual((await web3.eth.getBalance(MyNFT.address)).toString(), web3.utils.toWei("2.1525"));

    // Verifies rounding was successfully performed
    await MyNFT.bid(0, "0x0000000000000000000000000000000000000000", { from: accounts[3], value: (await MyNFT.getNextBid.call(0)) });
    assert.strictEqual((await web3.eth.getBalance(MyNFT.address)).toString(), web3.utils.toWei("3.3101"));

    // Verify the listing's final state is still accurate
    listing = await MyNFT.getListing.call(0);
    assert.strictEqual(listing.creator, accounts[1]);
    assert.strictEqual(listing.currency, "0x0000000000000000000000000000000000000000");
    assert.strictEqual(listing.platform, ERC721.address);
    assert.strictEqual(listing.token.toString(), "100");
    assert.strictEqual(listing.price, web3.utils.toWei("1.1576"));
    assert.strictEqual(listing.referrer, "0x0000000000000000000000000000000000000000");
    assert.strictEqual(listing.allowMarketplace, false);
    assert.strictEqual(listing.marketplace, "0x0000000000000000000000000000000000000000");
    assert.strictEqual(listing.highBidder, accounts[3]);
    assert.strictEqual(+listing.endTime, endTime);
    assert.strictEqual(listing.paidOut, false);
  });

  it("should allow finishing auctions", async () => {
    let listing = await MyNFT.getListing.call(0);
    let lastBlock = await web3.eth.getBlock("latest");
    await new Promise((resolve) => web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [listing.endTime - lastBlock.timestamp], id: null
    }, () => resolve()));

    // Save the current balance of the owner/auction's creator
    let ownerBalance = new web3.utils.BN(await web3.eth.getBalance(accounts[0]));
    let creatorBalance = new web3.utils.BN(await web3.eth.getBalance(accounts[1]));

    // Also verifies anyone can finish the auction
    let finish = await MyNFT.finish(0, { from: accounts[4] });

    // Check the events
    finish = finish.logs;
    assert.strictEqual(finish.length, 1);
    finish = finish[0];
    assert.strictEqual(finish.event, "AuctionFinished");
    finish = finish.args;
    assert.strictEqual(finish.id.toString(), "0");
    assert.strictEqual(finish.nftRecipient, accounts[3]);
    assert.strictEqual(finish.price.toString(), web3.utils.toWei("1.1576"));

    assert.strictEqual((await MyNFT.balanceOf(accounts[0])).toString(), web3.utils.toWei("0.046304"));
    await MyNFT.withdraw(accounts[0], { from: accounts[9] });
    assert.strictEqual((await MyNFT.balanceOf(accounts[1])).toString(), web3.utils.toWei("1.111296"));
    await MyNFT.withdraw(accounts[1], { from: accounts[9] });

    // Make sure the listing was updated
    assert.strictEqual((await MyNFT.getListing.call(0)).paidOut, true);
    // Ensure funds were transferred
    assert.strictEqual((await web3.eth.getBalance(MyNFT.address)).toString(), web3.utils.toWei("2.1525"));
    assert.strictEqual((await web3.eth.getBalance(accounts[0])).toString(), ownerBalance.add(new web3.utils.BN(web3.utils.toWei("0.046304"))).toString());
    assert.strictEqual((await web3.eth.getBalance(accounts[1])).toString(), creatorBalance.add(new web3.utils.BN(web3.utils.toWei("1.111296"))).toString());
    // Check the NFT was transferred
    assert.strictEqual(await ERC721.ownerOf.call(100), accounts[3]);
  });
});
