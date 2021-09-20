<template>

  <el-dialog
      title="Wrong Network"
      :visible.sync="chainInvalid"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      width="500px"
    >

      <!-- <el-button class="btn-close is-themed" type="default" circle @click="cancel()">
        <i class="el-icon-close icon" />
      </el-button> -->

      <span>Change network to <span v-for="(chain, i) in chainNames" :key="i">{{chain}} </span> and refresh the page.</span>
    </el-dialog>

</template>

<script>
export default {
  name: 'DialogNetwork',
  computed: {
    chainInvalid () {
      return this.$store.state.wallets.chainInvalid
    },
    chainNames () {
      return this.$config.chainNames
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

  .el-dialog
    padding $space-m
    max-width 90%

  .el-dialog__header
    padding $space-m

  .el-dialog__body
    padding 0 $space-m $space-m $space-m
    font-size $size-m

</style>
