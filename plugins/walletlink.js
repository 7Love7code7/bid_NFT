import WalletLink from 'walletlink'
import Web3 from 'web3'

const APP_NAME = 'MyNFT'
const APP_LOGO_URL = ''
const ETH_JSONRPC_URL = '--' // infura
const CHAIN_ID = 1

// Initialize WalletLink
export const walletLink = new WalletLink({
  appName: APP_NAME,
  appLogoUrl: APP_LOGO_URL,
  darkMode: false
})

// Initialize a Web3 Provider object
export const ethereum = walletLink.makeWeb3Provider(ETH_JSONRPC_URL, CHAIN_ID)

// Initialize a Web3 object
export const web3 = new Web3(ethereum)

export const network = ({ $store, onChainChange, onChainError }) => {
  web3.eth.net.getNetworkType((err, chainId) => {
    if (err) {
      onChainError({ $store })
    }

    return onChainChange({ $store, chainId })
  })
}

// check connection via object
export const connected = () => {
  return ethereum._addresses.length > 0
}

// request accounts via UI
export const request = ({ type, $store, onAccountChange, onChainChange, onChainError, onDisconnect, onError }) => {
  if (!ethereum) {
    return
  }

  ethereum.send('eth_requestAccounts')
    .then((accounts) => {
      if (accounts.length) {
        network({ $store, onChainChange, onChainError })
        listeners({ $store, onAccountChange, onChainChange, onDisconnect })
      }

      web3.eth.defaultAccount = accounts[0]
      return onAccountChange({ $store, type, accounts, web3 })
    })
    .catch((err) => {
      return onError({ $store, type, err })
    })
}

export const close = () => {
  return walletLink.disconnect()
}

export const listeners = ({ $store, onAccountChange, onChainChange, onDisconnect }) => {
  // always on main network, disconnect from app reload page, can't listen for accounts changing
}
