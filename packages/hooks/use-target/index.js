import { computed, inject } from 'vue'
import _ from 'lodash-es'
import utils from '@ER/utils'

export const useTarget = () => {
  const { state, setSelection, props } = inject('Everright')
  const selection = computed(() => state.selected)
  const isSelectRoot = computed(() => state.selected === state.config)
  const isSelectAnyElement = computed(() => !isSelectRoot.value)
  const type = computed(() => state.selected?.type)
  const isSelectField = computed(() => utils.checkIsField(state.selected))
  const target = computed(() => state.selected)
  const col = computed(() => !_.isEmpty(state.selected) && state.selected.context?.col)
  const isPc = computed(() => state.platform === 'pc')
  const isEditModel = computed(() => /^(edit|config)$/.test(state.mode))
  const checkTypeBySelected = (nodes = [], propType) => {
    if (_.isEmpty(state.selected)) return false
    return props.checkPropsBySelected(state.selected, propType) ?? nodes.includes(type.value)
  }
  const selectionTypes = ['grid', 'tabs', 'collapse', 'table', 'subform']
  const [isSelectGrid, isSelectTabs, isSelectCollapse, isSelectTable, isSelectSubform] =
    selectionTypes.map(type => computed(() => checkTypeBySelected([type])))

  return {
    state,
    setSelection,
    selection,
    isSelectAnyElement,
    isSelectRoot,
    type,
    isSelectField,
    target,
    col,
    checkTypeBySelected,
    isSelectGrid,
    isSelectTabs,
    isSelectCollapse,
    isSelectTable,
    isSelectSubform,
    isPc,
    isEditModel
  }
}
