export const state = () => ({
  waiting: true
})

export const mutations = {
  open (state) {
    state.waiting = false
  },
  waiting (state) {
    state.waiting = true
  },
  close (state) {
    state.waiting = true
  }
}
