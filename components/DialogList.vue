<template>

  <el-dialog
    :visible.sync="showModal"
    title="Start an Auction"
    label-width="0px"
    width="400px"
    >

    <el-button class="btn-close is-themed" type="default" circle @click="cancel()">
      <i class="el-icon-close icon" />
    </el-button>

    <el-form :model="form" label-position="top">

      <el-form-item label="Contract Address">
        <el-input v-model="form.platform" placeholder="enter contract address ..."></el-input>
      </el-form-item>
      <el-form-item label="Token Id">
        <el-input v-model="form.token" placeholder="enter token id ..."></el-input>
      </el-form-item>
      <el-form-item label="Price">
        <el-input-number
          v-model="price"
          @change="priceChanged"
          :precision="3"
          :step="0.01"
          :min="0.001"
          :max="100"
        ></el-input-number>
      </el-form-item>
      <el-form-item label="Days">
        <el-input-number v-model="days" @change="daysChanged" :min="1" :max="10"></el-input-number>
      </el-form-item>

    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button type="primary" :loading="waiting" class="btn-action is-themed" size="default" @click="list()">Start Auction</el-button>
    </span>
  </el-dialog>

</template>

<script>
export default {
  name: 'DialogList',
  data () {
    return {
      price: 0.1,
      days: 5
    }
  },
  computed: {
    showModal () {
      return this.$store.state.MyNFT.listModal ? true : null
    },
    waiting () {
      return (this.$store.state.MyNFT.approving || this.$store.state.MyNFT.listing) ? true : null
    },
    form () {
      const listModal = this.$store.state.MyNFT.listModal

      if (!listModal) {
        return {}
      }

      return {
        platform: listModal.platform,
        token: listModal.token
      }
    }
  },
  methods: {
    cancel () {
      this.$store.commit('MyNFT/listModal', false)
    },
    async list () {
      const listings = require('~/plugins/listings.js')

      const listModal = this.$store.state.MyNFT.listModal

      const params = {
        platform: listModal.platform,
        token: listModal.token,
        price: this.price.toString(),
        days: this.days.toString()
      }

      const list = await listings.list({
        $store: this.$store,
        params
      })

      await listings.getOwnedNFTs(this)
      await listings.getOwnedListings(this)

      this.cancel()

      return list
    },
    priceChanged (value) {
      this.price = value
    },
    daysChanged (value) {
      this.days = value
    }
  }
}
</script>

<style lang="stylus">
  .el-form-item__label
    line-height 18px

  .btn-close
    position absolute
    top $space-s
    right $space-s

  .btn-action
    width 100%

</style>
