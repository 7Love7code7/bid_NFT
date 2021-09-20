<template>
  <div class="nav is-themed">
    <div class="nav-action">
      <NuxtLink :to="path" class="nav-profile el-button el-button--default is-circle is-themed">
        <i class="el-icon-arrow-left" />
      </NuxtLink>

      <div v-if="drop" class="nav-label">
        {{ drop.label }}

        <small>
          {{ drop.address }}
        </small>
      </div>
    </div>

    <div v-if="(drop && !$device.isMobile)" class="nav-action">
      <a v-if="drop.owned" class="el-button el-button--info is-round" :href="drop.external_link" target="_blank">
        SELL
      </a>
      <a v-else class="el-button el-button--info is-round" :href="drop.external_link" target="_blank">
        BUY
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DropNav',
  props: {
    drop: Object
  },
  data () {
    return {
      tokens: []
    }
  },
  computed: {
    path () {
      return '/'
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
    font-size 18px
    padding-left $space-m
    font-weight bold

    small
      font-weight normal
      font-size 14px
      display block
      color $grey
      white-space nowrap
      text-overflow ellipsis
      overflow hidden
      width 300px
      max-width 90%

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
    justify-content flex-start
    align-items center

  .el-button
    text-decoration none

</style>
