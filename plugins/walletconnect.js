import Web3 from 'web3'
import WalletConnectProvider from '@walletconnect/web3-provider'
import WalletConnect from '@walletconnect/client'

//  Create WalletConnect Provider
export const provider = new WalletConnectProvider({
  infuraId: '--'
})

export const web3 = new Web3(provider)

export const network = ({ $store, onChainChange, onChainError }) => {
  web3.eth.net.getNetworkType((err, chainId) => {
    if (err) {
      onChainError({ $store })
    }

    return onChainChange({ $store, chainId })
  })
}

export function connected () {
  // Initialize a Web3 object
  const connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org'
  })

  return connector.connected
}

export async function request ({ type, $store, onAccountChange, onChainChange, onChainError, onDisconnect, onError }) {
  //  Enable session (triggers QR Code modal)
  await provider.enable()

  const accounts = await web3.eth.getAccounts()

  if (accounts.length) {
    network({ $store, onChainChange, onChainError })
    listeners({ $store, onAccountChange, onChainChange, onDisconnect })
  }

  web3.eth.defaultAccount = accounts[0]

  return onAccountChange({ $store, type, accounts, web3 })
}

// close connection (refreshes window)
export async function close () {
  await provider.disconnect()
}

export const listeners = ({ $store, onAccountChange, onChainChange, onDisconnect }) => {
  const type = 'walletconnect'

  provider.on('accountsChanged', accounts => onAccountChange({ $store, accounts, type, web3 }))
  provider.on('chainChanged', chainId => onChainChange({ $store, chainId }))
  provider.on('disconnect', code => onDisconnect({ $store, code }))
  provider.on('session_update', payload => onAccountChange({ $store, accounts: payload }))
}
