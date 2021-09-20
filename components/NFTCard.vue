<template>
  <el-card class="card is-themed" shadow="hover" :body-style="{ padding: '0px' }">
    <div class="card-image" @click="list()">
      <div class="card-image-spacing">
        <img :src="item.image_preview_url" class="image">
      </div>
    </div>

    <div class="card-footer">
      <div class="details">
        <span class="title">{{ item.label }}</span>
      </div>

      <el-popover
        placement="top"
        title="Unlocked"
        width="240"
        trigger="hover"
        :content="`You own this ${item.type}.`">

        <div slot="reference" class="action unlocked">
          {{item.nextBid}}
        </div>
      </el-popover>

    </div>
  </el-card>
</template>

<script>
export default {
  name: 'NFTCard',
  props: {
    item: Object,
    type: String
  },
  methods: {
    list () {
      this.$store.commit('MyNFT/listModal', this.item)
    }
  }
}
</script>
