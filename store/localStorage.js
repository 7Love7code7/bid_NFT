export const state = () => ({
  wallet: {
    provider: null, // if this exists, app will use it try to reconnect and ignore other connections
    keepDisconnect: false, // metamask doesn't really disconnect ... this prevents loading the app as connected, even though it is
    expire: 1 // 1 hour ... reconnects on refresh
  },
  listings: {
    list: [],
    owned: [],
    nfts: [],
    active: null,
    expire: 0.5 // 30 minutes
  }
})

export const mutations = {
  provider (state, provider) {
    state.wallet.provider = provider
  },
  disconnect (state) {
    state.wallet.provider = null
  },
  keepDisconnect (state) {
    state.wallet.keepDisconnect = true
  },
  resetDisconnect (state) {
    state.wallet.keepDisconnect = false
  },
  listing (state, list) {
    state.listings.list = list
  },
  owned (state, owned) {
    state.listings.owned = owned
  },
  nfts (state, nfts) {
    state.listings.nfts = nfts
  },
  active (state, listing) {
    state.listings.active = listing
  }
}
