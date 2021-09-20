<template>
  <div class="nav is-themed">
    <div class="nav-action">
      <NuxtLink :to="path" class="nav-profile el-button el-button--default is-circle is-themed">
        <i class="el-icon-arrow-left" />
      </NuxtLink>

      <div v-if="listing" class="nav-label">
        {{ time }}

        <small>
          {{ date }}
        </small>
      </div>

      <div class="spacer">

      </div>
    </div>

  </div>
</template>

<script>
import RealtimeCountdown from 'realtime-countdown'
import dateFormat from 'dateformat'

let listingTimer

export default {
  name: 'ListingNav',
  data () {
    return {
      time: 0
    }
  },
  computed: {
    path () {
      return '/'
    },
    date () {
      if (!this.listing) {
        return ''
      }

      const endTime = this.listing.endTime * 1000

      return dateFormat(endTime, 'ddd, mmmm dS, yyyy, h:MM:ss TT')
    },
    listing () {
      return this.$store.state.localStorage.listings.active
    }
  },
  watch: {
    listing () {
      this.timeLeft()
    }
  },
  mounted () {
    setTimeout(() => {
      this.timeLeft()
    })
  },
  beforeDestroy () {
    if (listingTimer) {
      listingTimer.destroy()
    }
  },
  methods: {
    setTimeLeft (t) {
      this.time = `${t.days}d ${t.hours}h ${t.minutes}m ${t.seconds}s`
    },
    timeLeft () {
      if (listingTimer) {
        listingTimer.destroy()
      }

      if (!this.listing) {
        return
      }

      const timeStamp = this.listing.endTime * 1000

      const onCountInitialized = t => this.setTimeLeft(t)

      const onCount = t => this.setTimeLeft(t)

      const onCountEnd = (t) => {
        this.time = 'Ended'
      }

      listingTimer = new RealtimeCountdown({ timeStamp, onCountInitialized, onCount, onCountEnd })
    }
  }
}
</script>

<style scoped lang="stylus">
.nav
  width 100%
  display flex
  justify-content space-between
  align-items center
  position relative
  z-index 1000
  padding 0 $space-m

  .nav-label
    width 240px
    font-size 18px
    font-weight bold
    text-align center

    small
      font-weight normal
      font-size 14px
      display block
      color $grey
      white-space nowrap
      text-overflow ellipsis
      overflow hidden
      width 100%

  .logo
    padding 16px 24px
    display block

    svg
      width auto
      height 20px
      position relative
      top 3px
      fill $dark

  .nav-action
    padding 16px 0
    display flex
    justify-content space-between
    align-items center
    width 100%

  .el-button
    text-decoration none

  .spacer
    width 36px

</style>
