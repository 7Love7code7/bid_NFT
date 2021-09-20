export const state = () => ({
  bidding: false,
  listModal: false,
  listing: false,
  signing: false,
  error: null
})

export const mutations = {
  bidding (state, action = true) {
    state.bidding = action
  },
  listModal (state, visible) {
    state.listModal = visible
  },
  signing (state, request) {
    state.signing = request
  },
  listing (state, request) {
    state.listing = request
  },
  error (state, error) {
    state.error = error
  }
}
