<template>
  <div id="check-connection" />
</template>

<script>
export default {
  name: 'CheckConnection',
  mounted () {
    const wallets = require('~/plugins/wallets.js')

    wallets.checkProvider({ $store: this.$store })
    wallets.checkConnection({ $store: this.$store })
  }
}

</script>

<style lang="stylus">
  #check-connection
      position fixed
      bottom 0
      right 0
      width 0
      height 0
</style>
