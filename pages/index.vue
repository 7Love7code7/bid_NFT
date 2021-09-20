<template>
  <div v-if="list" class="container">
    <Nav />

    <Listings :list="list" type="listing" />
  </div>
</template>

<script>
export default {
  name: 'Home',
  computed: {
    list () {
      return this.$store.state.localStorage.listings.list
    }
  },
  mounted () {
    setTimeout(() => {
      this.fetchListings()
    }, 500)
  },
  methods: {
    async fetchListings () {
      const listings = require('~/plugins/listings.js')

      this.$nuxt.$loading.start()

      await listings.get(this)

      this.$nuxt.$loading.finish()
    }
  }
}
</script>
