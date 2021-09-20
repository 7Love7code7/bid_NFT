
# MyNFT

Time-based bidding auctions for NFT's (non-fungible tokens).

## Definitions

### Nouns

- **Platform** - a specific ERC-721 contract address
- **Token** - the corresponding token id related to the contract address
- **NFT** - a non-fungible token, with both a platform and token, created outside of MyNFT
- **Listing** - an auction wrapper, for an NFT, created with MyNFT
- **Id** - the id of a MyNFT Listing
- **Owned** - a specific accounts Listings, created with MyNFT
- **Owned NFTs** - a specific accounts NFTs that have *not yet* been listed with MyNFT
- **Balance** - a specific accounts ETHER wallet balance (i.e. 502.000 ETH)
- **Account User** - a user that has an active connected wallet to MyNFT
- **Non-Account User** -  a user that does *not* have an active connected wallet to MyNFT

### Actions

- **connect** - when a user connects their wallet to MyNFT
- **disconnect** - when a user disconnects their wallet from MyNFT
- **list** - when a user creates a Listing from their Owned NFTs
- **bid** - when a user places a bid on another users Listing
- **finish** - when a user ...

## Build Setup

MyNFT uses Nuxt.js as the underlying framework for app architecture.
```bash

# install nuxt cli (or globally if you prefer with -g)
$ npm i @nuxt/cli

# install dependencies
$ yarn

# serve with hot reload at localhost:3000
$ npm run dev

# serve with hot reload at [your ip] (helpful for mobile testing)
$ npm run dev:host

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For a detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).

## Build Setup

Using digital ocean:

* Create new app
* Connect to repo / branch of choice
* Ensure under Settings > App Spec that run_command is set as follows:

```
run_command: npm start -- --hostname 0.0.0.0 --port 8080
```

* Here is a full example with "Crypto-SI/MyNFTUI" as the targeted repo, and "Amsterdam" (ams) as the region:

```
name: MyNFT
region: ams
services:
- build_command: npm run build
  environment_slug: node-js
  github:
    branch: main
    deploy_on_push: true
    repo: Crypto-SI/MyNFTUI
  http_port: 8080
  instance_count: 1
  instance_size_slug: basic-xs
  name: MyNFT
  routes:
  - path: /
  run_command: npm start -- --hostname 0.0.0.0 --port 8080
```

## Plugins

Active:
```
@/plugins/wallets // manages web3 providers and wallets
@/plugins/MyNFT // manages MyNFT calls
@/plugins/opensea // manages OpenSea calls
@/plugins/listings // manages calls and states
```

Not active:

```
@/plugins/walletconnect
@/plugins/walletlink
```

## Modules
```
@nuxtjs/axios // http requests
@nuxtjs/pwa // progressive web app cool stuff
@nuxt/content // headless server for json, markdown, etc
nuxt-webfontloader // typekit fonts
nuxt-vuex-localstorage // optimistic data storage (encrypted)
```

## Build Modules
```
@nuxtjs/eslint-module
@nuxtjs/style-resources
@aceforth/nuxt-optimized-images
@nuxtjs/svg
@nuxtjs/device
@nuxtjs/google-gtag
@nuxtjs/color-mode
```

## MyNFT UI

How users connect and interface with MyNFT auctions.

### Bidding

- After a user lists an auction on MyNFT, the countdown timer begins.
- A user can bid from a &lt;Card/&gt; component or from a &lt;Listing/&gt; view (see below).
- Bidding occurs from a modal or panel and does not require a user to leave their current view.

#### Time Display

- If time left is more than 1 day => ```1d 12h 3m```
- < 1 day => ```12h 3m 32s```
- < 1 hour => ```24m 50s```
- < 1 minute => ```22s left```
- timer up => ```Ended```

NOTE: If the timer is less than 3 minutes and a user attempts to bid, a warning is displayed to let the user know that their bid might not complete.

### Low-Latency

MyNFT uses a combination of Server-Side rendering, push state, and optimistic caching to ensure the app loads as quickly as possible, and with the latest data, every time.

#### Tactical Nuxt
- Leverages Nuxt SSR to render HTML and any available data from the server (on first load)
- Leverages Nuxt $route to load subsequent views from the client
- Leverages Nuxt $stores to show optimistic data, even between page refreshes

#### Example

1. User views Listing page
2. Requests are made to assemble data
3. Data is cached in local storage for 30 minutes
4. View displays cache
5. User leaves page and returns (or refreshes)
6. View displays cache and makes request in background
7. Back to #3

#### Fallback
1. Cache will display for up to 30 minutes if either MyNFT or OpenSea fails
2. If only OpenSea fails, app will still display data in all views, but with limited information

### States

MyNFT's views are controlled entirely by states, both browser and local storage, so it's easy to trigger UI changes from anywhere in the app.

#### App Store
Controls whether or not the app is ready to be displayed
```
$store.commit('app/open') // opens the app to display UI
$store.commit('app/close') // closes the app and displays no UI
```

#### MyNFT Store
Controls UI related to listing and bidding
```
$store.commit('MyNFT/listModal', { ... }) // show listing modal
$store.commit('MyNFT/listModal', false) // hide listing modal

$store.commit('MyNFT/approving', true/false) // show steps for approving listing
$store.commit('MyNFT/listing', true/false) // show steps for listing call
```

#### Wallet Store
Controls UI related to connecting to and displaying wallet information
```
$store.commit('wallets/balance', { balance, type }) // set a wallet balance
$store.commit('wallets/connected', { account }) // show user as connected in app
$store.commit('wallets/disconnect') // show user as disconnected in app
$store.commit('wallets/hasMetaMask', true/false) // display metamask UI
$store.commit('wallets/error', error) // display error modal
$store.commit('wallets/chain', error) // display message on network change (not active)
$store.commit('wallets/chainError', error) // display message on network error (not active)
```
#### LocalStorage Store
```
$store.commit('localStorage/listing', list) // populate Listings
$store.commit('localStorage/owned', list) // populate Owned Listings
$store.commit('localStorage/nfts', list) // populate Owned NFTs
$store.commit('localStorage/active', listing) // populate the current Listing view
```

### Data Mutations

#### Listings
Merges top-level MyNFT 'listings' and OpenSea 'assets', along with some minor transformations. When committed to store, the listing will look similar to this:

```
// MyNFT TRANSFORMS
platform: String, // "0x910Ec0d2eA92f5B6dd39DAB45Ba5891faE8bFB21"
token: String, // "56"
allowMarketplace: Boolean, // MyNFT
bids: Array, // MyNFT
creator: Object, // OPENSEA + MyNFT
currency: null,
currentBid: null, // MyNFT
endTime: "1619972542", // MyNFT
highBidder: null, // MyNFT
id: String, // MyNFT (ID)
label: "NFT Name Here",  // OPENSEA (NAME)
marketplace: null,
nextBid:"0.1", // MyNFT
paidOut: false, // MyNFT
referrer: null, // MyNFT

// OPENSEA BELOW
animation_original_url: null
animation_url:null
asset_contract:Object
background_color:null
collection:Object
creator:Object
decimals:0
description: String
external_link:"https://rarible.com/token/0xfa1..."
id:22760206
image_original_url:"https://ipfs.io/ipfs/QmXh..."
image_preview_url:"https://lh3.googleu..."
image_thumbnail_url:"https://lh3.googleuserc..."
image_url: "https://lh3.googleusercontent.c..."
is_presale:false
last_sale:Object
listing_date:null
name:"I Am Your Ice Ant"
num_sales:1
owned:false
permalink:"https://opensea.io/assets..."
sell_orders:null
token_id: "24"
top_bid:null
traits:Array[2]
transfer_fee:null
transfer_fee_payment_token:null
```

### Vue Directory


#### Layouts
----

**&lt;DefaultLayout/&gt;**

Wraps all other views. Ensures MyNFT is initiated before any views are displayed.

```
/layouts/default.vue
```
<br><br>
#### Views
----
**&lt;Home/&gt;**
Shows MyNFT Listings for both connected and non-connected users
```
route => '/'
/pages/index.vue
```

**&lt;Owned/&gt;**
Shows MyNFT Owned Listings
```
route => '/owned'
/pages/owned/index.vue
```

**&lt;Create/&gt;**
Shows MyNFT Owned NFT's and allows listing
```
route => '/create'
/pages/create/index.vue
```


**&lt;Listing/&gt;**
Shows a specific MyNFT listing and allows bidding
```
route => '/listing/{id}/{platform}/{token}'
/pages/listing/_id/_platform/_token.vue

$route.params = { id, platform, token }
```

**&lt;Connect/&gt;**
Allows user to connect to their wallet of choice. Once user is connected, redirects to Home.

Note: May be deprecated.
```
route => '/connect'
/pages/connect/index.vue

```

<br><br>
#### Components
----
**&lt;CheckConnection/&gt;**
Placed into DefaultLayout, automatically checks a users web3 connection on page load.
```
/components/CheckConnection.vue

<client-only>
    <CheckConnection />
</client-only>
```

**&lt;Nav/&gt;**
Optional on each page, automatically displays correct UI if user is connected or disconnected from app.
```
/components/Nav.vue

<Nav />
```


**&lt;DropNav/&gt;**
Simplified Nav used only for Listings view.
```
/components/DropNav.vue

<DropNav :drop="listing" />
```

**&lt;Listings/&gt;**
Displays mobile-friendly grids of Cards. Type is required to display either Listing cards of NFT cards. Will also display loading UI and empty state message if no results.
```
/components/Listings.vue

<Listings :list="list" type="listing" />

<Listings :list="nfts" type="nft" />
```

**&lt;Card/&gt;**
Displays a Listing and associated actions
```
/components/Card.vue

<Card :item="item" />
```


**&lt;NFTCard/&gt;**
Displays an NFT and associated actions. Click/tap will result in &lt;DialogList/&gt; displayed.
```
/components/NFTCard.vue

<NFTCard :item="item" />
```

**&lt;DialogList/&gt;**
Dialog modal for listing an NFT.
```
/components/DialogList.vue

<DialogList />
```
**&lt;DialogBid/&gt;**
Dialog modal for bidding on a Listing.
```
/components/DialogBid.vue

<DialogBid />
```
