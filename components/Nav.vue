<template>
  <div class="nav is-themed">
    <NuxtLink class="nav-logo" to="/">
      <span class="nav-logo-wrap">
        <MyNFTIcon class="logo-svg" />
      </span>
    </NuxtLink>

    <div class="nav-actions">
      <NuxtLink v-if="(!$device.isMobile && connected)" class="el-button el-button--text is-round is-themed" to="/">
        <span>Explore</span>
      </NuxtLink>

      <NuxtLink v-if="(!$device.isMobile && connected)" class="el-button el-button--text is-round is-themed" to="/owned">
        <span>My Auctions</span>
      </NuxtLink>

      <NuxtLink v-if="(!$device.isMobile && connected)" class="el-button el-button--text is-round is-themed" to="/create">
        <span>Create</span>
      </NuxtLink>

      <el-dropdown v-if="($device.isMobile  && connected)" trigger="click" @command="handleNavCommand" placement="bottom">
        <el-button class="is-themed" :circle="true">
          <i class="el-icon-more" />
        </el-button>
        <el-dropdown-menu slot="dropdown" style="width: 220px;">
          <el-dropdown-item command="/">
            Explore
          </el-dropdown-item>
          <el-dropdown-item command="/owned">
            My Auctions
          </el-dropdown-item>
          <el-dropdown-item command="/create">
            Create
          </el-dropdown-item>

        </el-dropdown-menu>
      </el-dropdown>

      <el-dropdown v-if="connected" trigger="click" @command="handleCommand">
        <el-button type="default" class="is-themed" :circle="true">
          <i class="el-icon-user" />
        </el-button>
        <el-dropdown-menu slot="dropdown" style="width: 280px;">

          <div class="balance">
            <div class="simple-list">
              <h5>
                Wallet

               <span class="truncate">
                  {{ address }}
                </span>
              </h5>

              <div class="simple-list-item">
                <div class="label">
                  <small>Balance</small>

                  {{ balances.ether }} <span>ETH</span>
                </div>
              </div>

            </div>
          </div>
          <el-dropdown-item v-if="$colorMode.value === 'light'" divided command="dark">
            Dark Mode
          </el-dropdown-item>
          <el-dropdown-item v-if="$colorMode.value === 'dark'" divided command="light">
            Light Mode
          </el-dropdown-item>
          <el-dropdown-item divided command="disconnect">
            Disconnect
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <el-button v-else type="info" :round="true" @click="connect()">
        Connect
      </el-button>

    </div>
  </div>
</template>

<script>
import MyNFTIcon from '~/assets/logos/MyNFT.svg?inline'

export default {
  name: 'Connected',
  components: {
    MyNFTIcon
  },
  computed: {
    balances (type) {
      const balances = Object.assign({}, this.$store.state.wallets.balances)

      if (!balances) {
        return
      }

      Object.keys(balances).forEach((b) => {
        balances[b] = Number.parseFloat(balances[b]).toFixed(3)
      })

      return balances
    },
    connected () {
      return this.$store.state.wallets.connected
    },
    address () {
      return this.$store.state.wallets.account
    }
  },
  methods: {
    connect () {
      const wallets = require('~/plugins/wallets.js')

      // clicking connect resets any trickery with app display
      this.$store.commit('localStorage/resetDisconnect')

      wallets.requestAccounts({
        $store: this.$store,
        type: 'browser'
      })
    },
    disconnect () {
      const wallets = require('~/plugins/wallets.js')

      wallets.manualDisconnect({ $store: this.$store, $notify: this.$notify })
    },
    dark () {
      this.$colorMode.preference = 'dark'
    },
    light () {
      this.$colorMode.preference = 'light'
    },
    handleNavCommand (command) {
      this.$router.push(command)
    },
    handleCommand (command) {
      this[command]()
    },
    toggleColorMode () {
      this.$colorMode.preference = 'white'
    }
  }
}
</script>

<style lang="stylus" scoped>

  .simple-list
    padding $space-s $space-m
    border-bottom none

    h5
      font-size 18px

  .simple-list-item
    border-bottom none

  h5
    margin-bottom $space-m

    span
      font-weight normal
      text-transform none

  .balance
    padding 0

    span
      font-size 12px
      color $grey

  .el-dropdown
    margin-left $space-m

    +for_breakpoint(xs sm)
      margin-left $space-xs

  .el-dropdown-menu
    .el-dropdown-menu__item
      position relative

    .el-badge__content
      position absolute
      right $space-m
      top $space-s

  .nav
    background-color $dark
    width 100%
    display flex
    justify-content space-between
    align-items center
    position relative
    z-index 1000
    overflow hidden

    .el-button
      font-family objektiv-mk1, sans-serif
      text-decoration none

    .el-button.el-button--text
      margin-left 0

    .el-button.is-profile
      margin-left 16px

  .nav-logo-wrap
    padding $space-s $space-m
    display block

  .logo-svg
    width auto
    height 50px
    position relative
    top 3px

  .nav-actions
    padding 0 16px
</style>
