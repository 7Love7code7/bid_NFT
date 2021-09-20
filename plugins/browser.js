import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'

// Initialize a Web3 Provider object
let provider

// Initialize a Web3 object
let web3

export async function setProvider () {
  provider = await detectEthereumProvider()

  web3 = new Web3(provider)
}

export const network = ({ $store, onChainChange, onChainError }) => {
  web3.eth.net.getNetworkType((err, chainId) => {
    if (err) {
      onChainError({ $store })
    }

    return onChainChange({ $store, chainId })
  })
}

// check connection via object
export async function connected () {
  if (!provider || !web3) {
    await setProvider()
  }

  if (!web3) {
    return
  }

  const accounts = await web3.eth.getAccounts()

  return accounts.length > 0
}

// request access through UI
export async function request ({ type, $store, onAccountChange, onChainChange, onChainError, onDisconnect, onError }) {
  if (!provider || !web3) {
    await setProvider()
  }

  provider
    .request({ method: 'eth_requestAccounts' })
    .then((accounts) => {
      if (accounts.length) {
        network({ $store, onChainChange, onChainError })
        listeners({ $store, onAccountChange, onChainChange, onDisconnect })
      }

      web3.eth.defaultAccount = accounts[0]

      return onAccountChange({ $store, type, accounts, web3Provider: web3 })
    })
    .catch((err) => {
      return onError({ $store, type, err })
    })

  return web3
}

export const close = () => {
  // return ethereum.close()
}

export const listeners = ({ $store, onAccountChange, onChainChange, onDisconnect }) => {
  if (!provider) {
    return
  }

  const type = 'browser'

  provider.on('accountsChanged', accounts => onAccountChange({ $store, accounts, type, web3Provider: web3 }))
  provider.on('chainChanged', chainId => onChainChange({ $store, chainId, web3Provider: web3 }))
  provider.on('disconnect', code => onDisconnect({ $store, code, web3Provider: web3 }))
}
