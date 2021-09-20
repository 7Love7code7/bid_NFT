<template>
  <el-card class="card is-themed" shadow="hover" :body-style="{ padding: '0px' }">
    <NuxtLink class="card-image" :to="`/listing/${ item.id }/${ item.platform }/${ item.token }`">
      <div class="card-image-spacing">
        <img :src="item.image_preview_url" class="image">
      </div>
    </NuxtLink>

    <div class="card-footer">
      <div class="details">
        <span class="title">{{ item.label }}</span>
        <span class="meta">{{ item.nextBid }} ETH</span>
      </div>

      <el-popover
        placement="top"
        title="Auction"
        width="240"
        trigger="hover"
        :content="`Ends in ${time}`">

        <div slot="reference" class="action unlocked">
          {{ time }}
        </div>
      </el-popover>

    </div>
  </el-card>
</template>

<script>
import RealtimeCountdown from 'realtime-countdown'

export default {
  name: 'Card',
  props: {
    item: Object,
    type: String
  },
  data () {
    return {
      time: 0
    }
  },
  mounted () {
    this.timeLeft()
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

      this.time = `${t.days}d ${t.hours}h ${t.minutes}m ${t.seconds}s`
    },
    timeLeft () {
      const timeStamp = this.item.endTime * 1000

      const onCountInitialized = t => this.setTimeLeft(t)

      const onCount = t => this.setTimeLeft(t)

      const onCountEnd = (t) => {
        this.time = 'Ended'
      }

      return new RealtimeCountdown({ timeStamp, onCountInitialized, onCount, onCountEnd })
    }
  }
}
</script>
