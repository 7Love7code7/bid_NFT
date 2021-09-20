<template>
  <div>

    <el-drawer
      :visible.sync="bidCallout"
      :show-close="false"
      :withHeader="false"
      size="132px"
      direction="btt"
      class="is-bid-callout"
      :modal="false"
      :modal-append-to-body="false"
      :append-to-body="false"
      :wrapperClosable="false"
    >
      <div class="panel-action">
        <a v-if="highBidder" class="el-button is-themed is-round">
          You are the Highest Bidder
        </a>
        <a v-else-if="insufficientFunds" class="el-button is-themed is-round">
          Insufficient Funds
        </a>
        <a v-else class="el-button is-themed is-round" @click="startBid()">
          BID
        </a>

        <span v-if="listing.owned">
          {{ listing.nextBid }} ETH (Next Bid)
        </span>

        <span v-else>
          {{ listing.nextBid }} ETH (Next Bid)
        </span>
      </div>
    </el-drawer>

    <el-drawer
      :visible.sync="bidAction"
      :show-close="false"
      :withHeader="false"
      size="80%"
      direction="btt"
      class="is-bid-action"
      :modal="true"
      :modal-append-to-body="false"
      :append-to-body="false"
      :wrapperClosable="false"
    >

      <el-button class="btn-close is-themed" type="default" circle @click="cancelBid()">
        <i class="el-icon-close icon" />
      </el-button>

      <div v-if="!error" class="panel-action is-bid-action">
        <h3>Placing Your Bid</h3>

        <div class="action-step">

          <h4>Approve</h4>

          <p>
            Checking balance and approving
          </p>

        </div>

      </div>

      <div v-else class="panel-action">
        {{ error }}
      </div>
    </el-drawer>

  </div>

</template>

<script>
import RealtimeCountdown from 'realtime-countdown'

export default {
  name: 'BidAction',
  props: {
    listing: Object
  },
  data () {
    return {
      time: 0
    }
  },
  mounted () {
    this.timeLeft()
  },
  computed: {
    bidCallout () {
      return (this.listing && !this.$store.state.MyNFT.bidding)
    },
    bidAction () {
      return this.$store.state.MyNFT.bidding
    },
    error () {
      return this.$store.state.MyNFT.error
    },
    highBidder () {
      const account = this.$store.state.wallets.account
      const highBidder = this.listing.highBidder

      return ((account && highBidder) && (account.toLowerCase() === highBidder.toLowerCase()))
    },
    insufficientFunds () {
      const balances = this.$store.state.wallets.balances
      let balance = balances.ether
      let nextBid = this.listing.nextBid

      if (balance === 0) {
        return true
      }

      if (!balance || !nextBid) {
        return
      }

      balance = Number(balance)
      nextBid = Number(nextBid)

      return (balance < nextBid)
    }
  },
  methods: {
    setTimeLeft (t) {
      if (t.days === '0') {
        this.time = `${t.hours}h ${t.minutes}m ${t.seconds}s`
        return
      }

      if (t.hours === '0') {
        this.time = `${t.minutes}m ${t.seconds}s`
        return
      }

      if (t.minutes === '0') {
        this.time = `${t.seconds}s`
        return
      }

      this.time = `${t.days}d ${t.hours}h ${t.minutes}m`
    },
    timeLeft () {
      const timeStamp = this.listing.endTime * 1000

      const onCountInitialized = t => this.setTimeLeft(t)

      const onCount = t => this.setTimeLeft(t)

      const onCountEnd = (t) => {
        this.time = 'Ended'
      }

      return new RealtimeCountdown({ timeStamp, onCountInitialized, onCount, onCountEnd })
    },
    async startBid () {
      const listings = require('~/plugins/listings.js')

      const payload = {
        $store: this.$store,
        id: this.listing.id
      }

      await listings.bid(payload)

      await this.refetchListing()
    },
    cancelBid () {
      this.$store.commit('MyNFT/error', false)
      this.$store.commit('MyNFT/bidding', false)
    },
    async refetchListing () {
      const listings = require('~/plugins/listings.js')

      this.$nuxt.$loading.start()

      await listings.getOne(this)

      this.$nuxt.$loading.finish()
    }
  }
}
</script>

<style lang="stylus">

  h3
    font-size 18px
    font-weight $weight-bold
    padding-bottom $space-m

  .el-drawer__wrapper
    top auto

    &.is-bid-callout
      height 132px

    &.is-bid-action
      height 80%

  .panel-action
    padding $space-l $space-m

    &.is-bid-action
      padding-bottom $space-xl

    span
      font-size 14px
      text-align center
      display block
      padding $space-s

    .el-button
      width 100%
      text-decoration none

  .btn-close
    position absolute
    top $space-s
    right $space-s

</style>
