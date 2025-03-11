<script>
import { ref, inject } from 'vue'
import hooks from '@ER/hooks'
import Icon from '@ER/icon'
export default {
  name: 'er-DeviceSwitch'
}
</script>
<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: 'pc'
  }
})
const emit = defineEmits(['update:modelValue'])
const editor= inject('editor')
let ns=editor.useHook('useNamespace', 'DeviceSwitch')//
</script>
<template>
  <div :class="[ns.b()]">
    <Icon @click="() => emit('update:modelValue', 'pc')" icon="PC" :class="[ns.e('icon'), props.modelValue === 'pc' && 'active']"></Icon>
    <Icon @click="() => emit('update:modelValue', 'mobile')" icon="cellphone" :class="[ns.e('icon'), props.modelValue === 'mobile' && 'active']"></Icon>
  </div>
</template>

<style scoped>

</style>
