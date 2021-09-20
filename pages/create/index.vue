<template>
  <div class="container is-themed">
    <Nav />

    <div class="heading">
      <h2>
        Auction Your NFT's
      </h2>
    </div>

    <Listings :list="nfts" type="nft" />

    <a style="opacity: 0;" @click="createNFT()">NFT ME</a>

  </div>
</template>

<script>
export default {
  name: 'Create',
  computed: {
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

      await listings.getOwnedNFTs(this)

      this.$nuxt.$loading.finish()
    },
    async createNFT () {
      const listings = require('~/plugins/listings.js')

      const tokenId = Math.floor(Math.random() * 999)

      const nft = await listings.mint({ $store: this.$store, tokenId })

      this.fetchListings()

      return nft
    }
  }
}
</script>
