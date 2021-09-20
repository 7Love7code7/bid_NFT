const MyNFT = artifacts.require("MyNFT");


const ERC20 = artifacts.require("ERC20");
const ERC721 = artifacts.require("ERC721");


module.exports = function (deployer) {
  deployer.deploy(MyNFT);


  deployer.deploy(ERC20, 0);
  deployer.deploy(ERC20, 2);
  deployer.deploy(ERC20, 4);
  deployer.deploy(ERC20, 8);
  deployer.deploy(ERC20, 18);
  deployer.deploy(ERC721, "", "");

};
