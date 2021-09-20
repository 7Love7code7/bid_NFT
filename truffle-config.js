const path = require("path");

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    develop: {
      url: "ws://127.0.0.1:9545",
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: ["09005cef0f54b9610a51968d8fc802c87f2905dcb5a25c347de9f9ce565f1f21"],
          providerOrUrl: "wss://kovan.infura.io/ws/v3/c69af895ad2d42b59f68ef029aa9fe2c"
        });
      },
      network_id: 42,
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
    },
  },
};
