/**
 * Layer between client and MyNFT that performs method calls and manages states
 * @module listings
 * @example
 * const listings = require('~/plugins/listings.js')
 *
 * listings.get(...)
 */

/**
 * Mutations for assets from opensea
 * @name transformAssets
 * @method
 * @param {array} listings listings.assets[x] to transform
 * @memberof listings
 */

const transformAssets = (listings) => {
  if (!listings || !listings.assets) {
    return listings
  }

  return listings.assets.map((l, i) => {
    l.address = l.asset_contract.address

    l.owned = l.owner.address === 'foo'

    l.label = l.name

    l.index = i

    return l
  })
}

/**
 * Mutates listings from listing { object } to opensea assets
 * @name addAssetsToListings
 * @method
 * @param {array} listings { listing ... } to transform
 * @memberof listings
 */

async function addAssetsToListings (listings) {
  const seaport = require('~/plugins/opensea.js')

  const assetList = listings.map((l) => {
    return {
      token_id: l.token,
      address: l.platform
    }
  })

  const assets = transformAssets(await seaport.getAssets(assetList))

  return listings.map((l) => {
    let match = assets.find(t => t.address === l.platform && t.token === l.token_id)

    if (!match) {
      match = {
        label: `MyNFT ${l.id}`,
        creator: {
          address: l.creator,
          user: {}
        }
      }
    }

    return Object.assign({}, l, match)
  })
}

/**
 * Mutates NFT's from platform/token pairs to opensea assets
 * @name addAssetsToNfts
 * @method
 * @param {array} nfts { platform, token } to transform
 * @memberof listings
 */

async function addAssetsToNfts (nfts) {
  const seaport = require('~/plugins/opensea.js')

  const assetList = nfts.map((l) => {
    return {
      token_id: l.token,
      address: l.platform
    }
  })

  const assets = transformAssets(await seaport.getAssets(assetList))

  return assetList.map((n, i) => {
    let match = assets.find((a) => {
      return (a.address.toUpperCase() === n.address.toUpperCase()) && (a.token === n.token)
    })

    if (!match) {
      match = {
        label: `NFT ${i}`,
        creator: {
          address: n.creator,
          user: {}
        }
      }
    }

    return Object.assign({}, n, match)
  })
}

/**
 * Gets current listings (from route param), merges with open sea, then commits to store 'localStorage/listing'
 * @name get
 * @method
 * @param {object} $store context
 * @memberof listings
 */

export async function get ({ $store }) {
  const MyNFT = require('~/plugins/MyNFT.js')

  // get MyNFT listings
  const listings = await MyNFT.getListings()

  // get MyNFT listing for each
  for (const i in listings) {
    listings[i] = await MyNFT.getListing(i)
  }

  // get assets and merge data
  const assets = await addAssetsToListings(listings)

  // commit to store
  $store.commit('localStorage/listing', assets)
}

/**
 * Get a users MyNFT Listings, merges with open sea, then commits to store 'localStorage/owned'
 * @name getOwnedListings
 * @method
 * @param {object} $store context
 * @memberof listings
 */

export async function getOwnedListings ({ $store }) {
  const MyNFT = require('~/plugins/MyNFT.js')

  const account = $store.state.wallets.account

  if (!account) {
    return
  }

  // get MyNFT listings
  const listings = await MyNFT.getListings(account)

  // get MyNFT listing for each
  for (const i in listings) {
    listings[i] = await MyNFT.getListing(i)
  }

  // get assets and merge data
  const assets = await addAssetsToListings(listings)

  // commit to store
  $store.commit('localStorage/owned', assets)
}

/**
 * Gets a single listing (from route param), merges with open sea, then commits to store 'localStorage/active'
 * @name getOne
 * @method
 * @param {object} $store context
 * @param {object} $route context
 * @memberof listings
 */

export async function getOne ({ $store, $route }) {
  const MyNFT = require('~/plugins/MyNFT.js')

  const id = $route.params.id.toString()

  const listing = await MyNFT.getListing(id)

  const assets = await addAssetsToListings([listing])

  if (!assets || !assets.length) {
    return
  }

  $store.commit('localStorage/active', assets[0])
}

/**
 * Get a user's NFT's that haven't been listed, merges with open sea, then commits to store 'localStorage/owned'
 * @name getOwnedNFTs
 * @method
 * @param {object} $store context
 * @memberof listings
 */

export async function getOwnedNFTs ({ $store }) {
  const MyNFT = require('~/plugins/MyNFT.js')

  const nfts = await MyNFT.getNFTs()

  const assets = await addAssetsToNfts(nfts)

  $store.commit('localStorage/nfts', assets)

  return assets
}

/**
 * Lists an NFT to MyNFT
 * @name list
 * @method
 * @param {object} $store context
 * @param {object} params for listing
 * @memberof listings
 */

export async function list ({ $store, params }) {
  const MyNFT = require('~/plugins/MyNFT.js')

  $store.commit('MyNFT/signing', true)

  await MyNFT.signList(params)

  $store.commit('MyNFT/listing', true)
  $store.commit('MyNFT/signing', false)

  const result = await MyNFT.list(params)

  $store.commit('MyNFT/listing', false)

  return result
}

/**
 * Lists an NFT to MyNFT
 * @name list
 * @method
 * @param {object} $store context
 * @param {object} params for listing
 * @memberof listings
 */

export async function bid ({ $store, id }) {
  const MyNFT = require('~/plugins/MyNFT.js')

  $store.commit('MyNFT/signing', true)

  try {
    await MyNFT.signBid(id)
  } catch (err) {
    $store.commit('MyNFT/error', err.message)
    return
  }

  $store.commit('MyNFT/bidding', true)
  $store.commit('MyNFT/signing', false)

  try {
    await MyNFT.bid(id)
  } catch (err) {
    $store.commit('MyNFT/error', err.message)
    return
  }

  $store.commit('MyNFT/bidding', false)
}

/**
 * Mints an NFT (development only)
 * @name mint
 * @method
 * @param {object} $store context
 * @param {string} tokenId
 * @memberof listings
 */

export async function mint ({ $store, tokenId }) {
  const MyNFT = require('~/plugins/MyNFT.js')

  return await MyNFT.mintNFT(tokenId)
}
