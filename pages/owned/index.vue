<template>
  <div class="container is-themed">
    <Nav />

    <div class="heading">
      <h2>
        Your NFT Auctions
      </h2>
    </div>

    <Listings :list="owned" type="listing" />

    <div class="heading">
      <h2>
        Not Listed
      </h2>
    </div>

    <Listings :list="nfts" type="nft" />

  </div>
</template>

<script>
export default {
  name: 'Owned',
  computed: {
    owned () {
      return this.$store.state.localStorage.listings.owned
    },
    nfts () {
      return this.$store.state.localStorage.listings.nfts
    }
  },
  mounted () {
    setTimeout(() => {
      this.fetchListings()
    })
  },
  methods: {
    async fetchListings () {
      const listings = require('~/plugins/listings.js')

      this.$nuxt.$loading.start()

      await listings.getOwnedListings(this)
      await listings.getOwnedNFTs(this)

      this.$nuxt.$loading.finish()
    }
  }
}
</script>
