/**
 * Opensea.io js api cals
 * Simple, unannotated non-fungible asset spec
 * https://projectopensea.github.io/opensea-js/#fetching-assets
 * @module OpenSea
 * @example
 * const OpenSea = require('~/plugins/opensea.js')
 *
 * OpenSea.getAssets(...)
 */

import Web3 from 'web3'
import { OpenSeaPort, Network } from 'opensea-js'
import { settings } from '@/utils/settings'

// export interface Asset {
// The asset's token ID, or null if ERC-20
// tokenId: string | null,
// The asset's contract address
// tokenAddress: string,
// The Wyvern schema name (defaults to "ERC721") for this asset
// schemaName?: WyvernSchemaName,
// Optional for ENS names
// name?: string,
// Optional for fungible items
// decimals?: number
// }

const provider = new Web3.providers.HttpProvider(settings.infuraURL)

export const seaport = new OpenSeaPort(provider, {
  networkName: Network.Main
})

/**
 * Checks balance of specific address/token from opensea
 * Note ... not active or tested within MyNFT environment yet
 * @name checkBalance
 * @method
 * @param {string} address / platform
 * @param {array} list of assets
 * @param {object} $store context
 * @memberof OpenSea
 */

export async function checkBalance ({ address, tokens, $store }) {
  if (!tokens.assets) {
    return tokens
  }

  const balances = []
  let tick = 0

  for (const t of tokens.assets) {
    const asset = {
      tokenAddress: t.asset_contract.address,
      tokenId: t.token_id, // Token ID
      schemaName: t.asset_contract.schema_name
    }

    const balance = await seaport.getAssetBalance({ accountAddress: address, asset })

    if (balance.greaterThan(0)) {
      t.balance = balance.toNumber()
      t.owner.address = address
      tick = tick + 1
    }

    balances.push(t)
  }

  $store.commit('localStorage/balance', { balance: tick })

  tokens.assets = balances

  return tokens
}

/**
 * Gets a list of assets from opensea
 * @name getAssets
 * @method
 * @param {array} list of { address, token_id }
 * @memberof OpenSea
 */

export async function getAssets (list) {
  const options = { method: 'GET' }

  let results

  if (!list || !list.length) {
    return null
  }

  const query = list.map((l) => {
    return `&token_ids=${l.token_id}&asset_contract_addresses=${l.address}`
  })

  try {
    results = await fetch(`${settings.openseaAssetsURL}?order_direction=desc&offset=0&limit=40${query}`, options)
  } catch (e) {
    console.log('no results')
    return null
  }

  return await results.json()
}

/**
 * Gets a single asset from opensea
 * @name getAsset
 * @method
 * @param {object} list of { address, token_id }
 * @memberof OpenSea
 */

export async function getAsset ({ address, tokenId }) {
  const options = { method: 'GET' }

  let results

  try {
    results = await fetch(`${settings.openseaAssetsURL}?asset_contract_address=${address}&token_ids=${tokenId}`, options)
  } catch (e) {
    console.log('no results')
    return null
  }

  return await results.json()
}

/**
 * Gets a list of assets from opensea
 * @name getAssets
 * @method
 * @param {array} list of { address, token_id }
 * @memberof OpenSea
 */

export async function getOwned (account) {
  const options = { method: 'GET' }

  let results

  if (!account) {
    return null
  }

  const query = `&owner=${account}`

  try {
    results = await fetch(`${settings.openseaAssetsURL}?order_direction=desc&offset=0&limit=40${query}`, options)
  } catch (e) {
    console.log('no results')
    return null
  }

  return await results.json()
}
