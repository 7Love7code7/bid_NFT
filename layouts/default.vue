<template>
  <div>
    <Nuxt v-if="(loaded && ready)" />

    <DialogNetwork />

    <DialogList />

    <client-only>
      <CheckConnection />
    </client-only>
  </div>
</template>

<script>
export default {
  name: 'DefaultLayout',
  computed: {
    loaded () {
      return !this.$store.state.app.waiting
    },
    ready () {
      return this.$store.state.localStorage.status
    },
    pending () {
      return this.$store.state.wallets.pending
    },
    error () {
      return this.$store.state.wallets.error
    },
    listing () {
      return this.$store.state.MyNFT.listing
    },
    validated () {
      return this.$store.state.wallets.validated
    }
  },
  watch: {
    error (newError, oldError) {
      if (newError) {
        this.$notify({
          title: 'Error',
          message: newError,
          type: 'error'
        })

        this.$store.commit('wallets/error', false)
      }
    },
    pending (newPending, oldPending) {
      if (newPending) {
        // this.$notify({
        //   title: 'Request Sent',
        //   message: 'Connect your wallet',
        //   type: 'info'
        // })
      }
    }
  },
  mounted () {
    const settings = require('@/utils/settings')
    settings.set(this.$config)

    setTimeout(() => {
      this.initMyNFT()
    }, 500)
  },
  methods: {
    async initMyNFT () {
      const MyNFT = require('~/plugins/MyNFT.js')

      await MyNFT.init()

      this.$store.commit('app/open')
    }
  }
}
</script>
