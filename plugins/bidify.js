/* eslint-disable */

/**
 * MyNFT js methods
 * @module MyNFT
 * @example
 * const MyNFT = require('~/plugins/MyNFT.js')
 *
 * MyNFT.bid(...)
 */

import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'
import { ERC20JSON, ERC721JSON, MyNFT_JSON } from '@/utils/constants'
import { settings } from '@/utils/settings'

let web3
let MyNFT
let from


/**
 * Instantiates the MyNFT contract
 * @name init
 * @method
 * @memberof MyNFT
 */

export async function init () {
  const provider = await detectEthereumProvider()

  web3 = await new Web3(provider)

  MyNFT = await new web3.eth.Contract(MyNFT_JSON, settings.MyNFTAddress)
}

/**
 * Called when a user connects or changes accounts
 * @name onAccountChange
 * @method
 * @param {object} $store context
 * @param {string} type of wallet connection (browser, walletlink, walletconnect)
 * @param {array} accounts returned from request_accounts
 * @param {object} web3 provider returned from wallet provider
 * @memberof MyNFT
 */

export async function onAccountChange ({ $store, type, accounts, web3Provider }) {
  const account = accounts[0]

  const ready = $store.state.localStorage.status

  const keepDisconnect = ready ? $store.state.localStorage.wallet.keepDisconnect : null

  // no account, trigger a disconnect (this will fire on startup)
  if (!account || keepDisconnect) {
    $store.commit('wallets/disconnect')
    $store.commit('localStorage/disconnect')
    return
  }

  from = account
  web3 = web3Provider

  MyNFT = await new web3.eth.Contract(MyNFT_JSON, settings.MyNFTAddress)

  // const raw = await getETHBalance(account)
  const raw = await web3.eth.getBalance(account)

  const balance = web3.utils.fromWei(raw, 'ether')

  // set balance
  $store.commit('wallets/balance', { type: 'ether', balance })

  // connect wallet
  $store.commit('wallets/connected', { account, type })

  // save provider type
  $store.commit('localStorage/provider', type)
}

// Convert to a usable value
function atomic(value, decimals) {
  let quantity = decimals
  if (value.indexOf('.') !== -1) {
    quantity -= value.length - value.indexOf('.') - 1
  }
  let atomicized = value.replace('.', '')
  for (let i = 0; i < quantity; i++) {
    atomicized += '0'
  }
  while (atomicized[0] === '0') {
    atomicized = atomicized.substr(1)
  }
  return atomicized
}

// Convert to a human readable value
function unatomic(value, decimals) {
  value = value.padStart(decimals + 1, '0')
  let temp = (
    value.substr(0, value.length - decimals) +
    '.' +
    value.substr(value.length - decimals)
  )
  while (temp[0] === '0') {
    temp = temp.substr(1)
  }
  while (temp.endsWith('0')) {
    temp = temp.slice(0, -1)
  }
  if (temp.endsWith('.')) {
    temp = temp.slice(0, -1)
  }
  if (temp.startsWith('.')) {
    temp = '0' + temp
  }

  if (temp == '') {
    return '0'
  }
  return temp
}

// When currency is null, it's ETH

// Get the decimals of an ERC20
async function getDecimals(currency) {
  if (!currency) {
    return 18
  }

  return await (new web3.eth.Contract(ERC20JSON, currency)).methods.decimals().call()
}

// Get how many decimals MyNFT uses with an ERC20
async function getDecimalAccuracy(currency) {
  return Math.min(await getDecimals(currency), 4)
}

// Get the 'price unit' of an ERC20
// An ERC20 which MyNFT uses 4 decimals of has a price unit of 0.0001
// Every price value will be a multiple of this

async function getPriceUnit(currency) {
  let decimals = await getDecimals(currency)
  if (!currency) {
    currency = '0x0000000000000000000000000000000000000000'
  }
  return unatomic(await MyNFT.methods.getPriceUnit(currency).call(), decimals)
}

// Get the minimum price MyNFT will use in relation to an ERC20
export async function getMinimumPrice(currency) {
  let decimals = await getDecimals(currency)
  if (!currency) {
    currency = '0x0000000000000000000000000000000000000000'
  }
  return unatomic(
    (new web3.utils.BN(await MyNFT.methods.getPriceUnit(currency).call()))
      .mul(new web3.utils.BN(20)).toString(),
    decimals
  )
}

/**
 * Get all NFTs for the current user as a list of [{ platform, token }]
 * Only works for accounts who have received <1000 NFTs (including repeats)
 * Chunk the getPastLogs call or limit to a specific NFT platform to avoid this
 * @name getNFTs
 * @method
 * @memberof MyNFT
 */

export async function getNFTs() {
  // Get all transfers to us
  const logs = await web3.eth.getPastLogs({
    fromBlock: 0,
    toBlock: 'latest',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      null,
      '0x' + from.split('0x')[1].padStart(64, '0')
    ]
  })

  // Filter to just tokens which are still in our custody
  const res = []
  const ids = {}

  for (let log of logs) {
    let platform = log.address

    let token = log.topics[3]

    let owner = await (new web3.eth.Contract(ERC721JSON, platform)).methods.ownerOf(token).call()

    if (owner.toLowerCase() !== from.toLowerCase()) {
      continue
    }

    let jointID = platform + token

    if (ids[jointID]) {
      continue
    }

    token = parseInt(token, 16).toString()

    ids[jointID] = true

    res.push({ platform, token })
  }

  return res
}

/**
 * Wallet signature for approval for MyNFT contract
 * @name signList
 * @method
 * @param {string} currency to utilize
 * @param {string} platform to list
 * @param {string} token to list
 * @param {string} price to list at (minimum starting price)
 * @param {string} days to list for
 * @param {boolean} allowMarketplace
 * @memberof MyNFT
 */

export async function signList ({ currency, platform, token, price, days, allowMarketplace = false }) {
  let decimals = await getDecimals(currency)

  if (!currency) {
    currency = '0x0000000000000000000000000000000000000000'
  }

  await (new web3.eth.Contract(ERC721JSON, platform)).methods.approve(settings.MyNFTAddress, token).send({ from })
}

/**
 * Lists an ERC721 token with MyNFT
 * @name list
 * @method
 * @param {string} currency to utilize
 * @param {string} platform to list
 * @param {string} token to list
 * @param {string} price to list at (minimum starting price)
 * @param {string} days to list for
 * @param {boolean} allowMarketplace
 * @memberof MyNFT
 */

export async function list ({ currency, platform, token, price, days, allowMarketplace = false }) {
  let decimals = await getDecimals(currency)

  if (!currency) {
    currency = '0x0000000000000000000000000000000000000000'
  }

  return (await MyNFT.methods.list(
    currency, platform, token, atomic(price, decimals), days,
    '0x0000000000000000000000000000000000000000', allowMarketplace
  ).send({ from })).events.ListingCreated.returnValues[0]
}

/**
 * Gets a listing from MyNFT
 * @name getListing
 * @method
 * @param {string} id of listing
 * @memberof MyNFT
 */

export async function getListing (id) {
  const nullIfZeroAddress = (value) => {
    if (value === '0x0000000000000000000000000000000000000000') {
      return null
    }

    return value
  }

  let raw = await MyNFT.methods.getListing(id).call()
  let currency = nullIfZeroAddress(raw.currency)

  let highBidder = nullIfZeroAddress(raw.highBidder)
  let currentBid = raw.price
  let nextBid = await MyNFT.methods.getNextBid(id).call()
  let decimals = await getDecimals(currency)

  if (currentBid === nextBid) {
    currentBid = null
  } else {
    currentBid = unatomic(currentBid, decimals)
  }

  let referrer = nullIfZeroAddress(raw.referrer)
  let marketplace = nullIfZeroAddress(raw.marketplace)

  let bids = []

  for (let bid of await web3.eth.getPastLogs({
    fromBlock: 0,
    toBlock: 'latest',
    address: settings.MyNFTAddress,
    topics: [
      '0xdbf5dea084c6b3ed344cc0976b2643f2c9a3400350e04162ea3f7302c16ee914',
      '0x' + (new web3.utils.BN(id)).toString('hex').padStart(64, '0')
    ]
  })) {
    bids.push({
      bidder: '0x' + bid.topics[2].substr(-40),
      price: unatomic((new web3.utils.BN(bid.data.substr(2), 'hex')).toString(), decimals)
    })
  }

  return {
    id,
    creator: raw.creator,
    currency,
    platform: raw.platform,
    token: raw.token,

    highBidder,
    currentBid,
    nextBid: unatomic(nextBid, decimals),

    referrer,
    allowMarketplace: raw.allowMarketplace,
    marketplace,

    endTime: raw.endTime,
    paidOut: raw.paidOut,

    bids
  }
}

/**
 * Signs the bid before calling contract
 * @name signBid
 * @method
 * @param {string} id of listing to bid on
 * @memberof MyNFT
 */

export async function signBid (id) {
  let currency = (await getListing(id)).currency

  if (currency) {
    await (
      new web3.eth.Contract(ERC20JSON, currency)
    ).methods.approve(settings.MyNFTAddress, await MyNFT.methods.getNextBid(id).call()).send({ from })

    await MyNFT.methods.bid(id, '0x0000000000000000000000000000000000000000').send({ from })
  } else {
    return true
  }
}

/**
 * Bids on a listing via MyNFT
 * @name bid
 * @method
 * @param {string} id of listing to bid on
 * @memberof MyNFT
 */

export async function bid (id) {
  let currency = (await getListing(id)).currency

  if (currency) {
    await MyNFT.methods.bid(id, '0x0000000000000000000000000000000000000000').send({ from })
  } else {
    await MyNFT.methods.bid(id, '0x0000000000000000000000000000000000000000').send({ from, value: await MyNFT.methods.getNextBid(id).call() })
  }
}

/**
 * Gets all all recent listings from MyNFT
 * @name getListings
 * @method
 * @param {string} creator
 * @param {string} platform
 * @memberof MyNFT
 */

export async function getListings(creator, platform) {
  let creatorTopic = null
  if (creator) {
    creatorTopic = '0x' + creator.substr(2).toLowerCase().padStart(64, '0')
  }

  let platformTopic = null
  if (platform) {
    platformTopic = '0x' + platform.substr(2).toLowerCase().padStart(64, '0')
  }

  let res = []
  for (let listing of await web3.eth.getPastLogs({
    fromBlock: 0,
    toBlock: 'latest',
    address: settings.MyNFTAddress,
    topics: [
      '0xb8160cd5a5d5f01ed9352faa7324b9df403f9c15c1ed9ba8cb8ee8ddbd50b748',
      null,
      creatorTopic,
      platformTopic
    ]
  })) {
    res.push((new web3.utils.BN(listing.topics[1].substr(2), 'hex')).toString())
  }
  return res
}

/**
 * ...
 * @name finish
 * @method
 * @param {string} id of listing
 * @memberof MyNFT
 */

export async function finish(id) {
  await MyNFT.methods.finish(id).send({ from })
}

/**
 * Gets eth balance of current connected account
 * @name getETHBalance
 * @method
 * @memberof MyNFT
 */

export async function getETHBalance() {
  return unatomic((await MyNFT.methods.balanceOf(from).call()) || '0', 18)
}

/**
 * ...
 * @name withdraw
 * @method
 * @memberof MyNFT
 */

export async function withdraw() {
  await MyNFT.methods.withdraw(from).send({ from })
}

/**
 * ...
 * @name mintNFT
 * @method
 * @memberof MyNFT
 */

const TestNFTJSON = [{'inputs':[{'internalType':'string','name':'name_','type':'string'},{'internalType':'string','name':'symbol_','type':'string'}],'stateMutability':'nonpayable','type':'constructor'},{'anonymous':false,'inputs':[{'indexed':true,'internalType':'address','name':'owner','type':'address'},{'indexed':true,'internalType':'address','name':'approved','type':'address'},{'indexed':true,'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'Approval','type':'event'},{'anonymous':false,'inputs':[{'indexed':true,'internalType':'address','name':'owner','type':'address'},{'indexed':true,'internalType':'address','name':'operator','type':'address'},{'indexed':false,'internalType':'bool','name':'approved','type':'bool'}],'name':'ApprovalForAll','type':'event'},{'anonymous':false,'inputs':[{'indexed':true,'internalType':'address','name':'from','type':'address'},{'indexed':true,'internalType':'address','name':'to','type':'address'},{'indexed':true,'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'Transfer','type':'event'},{'inputs':[{'internalType':'bytes4','name':'interfaceId','type':'bytes4'}],'name':'supportsInterface','outputs':[{'internalType':'bool','name':'','type':'bool'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[{'internalType':'address','name':'owner','type':'address'}],'name':'balanceOf','outputs':[{'internalType':'uint256','name':'','type':'uint256'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[{'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'ownerOf','outputs':[{'internalType':'address','name':'','type':'address'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[],'name':'name','outputs':[{'internalType':'string','name':'','type':'string'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[],'name':'symbol','outputs':[{'internalType':'string','name':'','type':'string'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[{'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'tokenURI','outputs':[{'internalType':'string','name':'','type':'string'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[],'name':'baseURI','outputs':[{'internalType':'string','name':'','type':'string'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[{'internalType':'address','name':'owner','type':'address'},{'internalType':'uint256','name':'index','type':'uint256'}],'name':'tokenOfOwnerByIndex','outputs':[{'internalType':'uint256','name':'','type':'uint256'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[],'name':'totalSupply','outputs':[{'internalType':'uint256','name':'','type':'uint256'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[{'internalType':'uint256','name':'index','type':'uint256'}],'name':'tokenByIndex','outputs':[{'internalType':'uint256','name':'','type':'uint256'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[{'internalType':'address','name':'to','type':'address'},{'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'approve','outputs':[],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'getApproved','outputs':[{'internalType':'address','name':'','type':'address'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[{'internalType':'address','name':'operator','type':'address'},{'internalType':'bool','name':'approved','type':'bool'}],'name':'setApprovalForAll','outputs':[],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'address','name':'owner','type':'address'},{'internalType':'address','name':'operator','type':'address'}],'name':'isApprovedForAll','outputs':[{'internalType':'bool','name':'','type':'bool'}],'stateMutability':'view','type':'function','constant':true},{'inputs':[{'internalType':'address','name':'from','type':'address'},{'internalType':'address','name':'to','type':'address'},{'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'transferFrom','outputs':[],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'address','name':'from','type':'address'},{'internalType':'address','name':'to','type':'address'},{'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'safeTransferFrom','outputs':[],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'address','name':'from','type':'address'},{'internalType':'address','name':'to','type':'address'},{'internalType':'uint256','name':'tokenId','type':'uint256'},{'internalType':'bytes','name':'_data','type':'bytes'}],'name':'safeTransferFrom','outputs':[],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'address','name':'to','type':'address'},{'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'_mintActual','outputs':[],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'uint256','name':'tokenId','type':'uint256'}],'name':'_mint','outputs':[],'stateMutability':'nonpayable','type':'function'}]

export async function mintNFT (token) {
  await (new web3.eth.Contract(TestNFTJSON, settings.nftAddress)).methods._mint(token).send({ from })

  return { token, address: settings.nftAddress }
}
