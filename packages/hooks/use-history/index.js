import { ref, markRaw, nextTick, watch } from 'vue'
import utils from '@ER/utils'
import _ from 'lodash-es'

export const useHistory = (source) => {
  const onOff = ref(true)
  const undoStack = ref([])
  const redoStack = ref([])
  const last = ref(markRaw({ snapshot: JSON.stringify(source.store), timestamp: Date.now() }))
  const setSource = (state) => {
    last.value = state
    toggleHistory(false)
    source.store = JSON.parse(state.snapshot)
    source.store.forEach((e) => {
      utils.addContext(e, source.store, false, (node) => {
        if (source.sector?.id === node.id) source.sector = node
      })
    })
    nextTick(() => toggleHistory(true))
  }
  const performAction = (fromStack, toStack) => {
    const state = fromStack.value.shift()
    if (state) {
      toStack.value.unshift(last.value)
      setSource(state)
    }
  }

  const toggleHistory = (state) => { onOff.value = state }

  watch(() => source.store, _.debounce(() => { if (onOff.value) last.value = markRaw({ snapshot: JSON.stringify(source.store), timestamp: Date.now() }) }, 400), {
    flush: 'post',
    deep: true
  })

  return {
    canUndo: ref(() => undoStack.value.length > 0),
    canRedo: ref(() => redoStack.value.length > 0),
    undo: () => performAction(undoStack, redoStack),
    redo: () => performAction(redoStack, undoStack),
    undoStack,
    redoStack,
    last,
    stop: () => toggleHistory(false),
    restart: () => { toggleHistory(true); last.value = markRaw({ snapshot: JSON.stringify(source.store), timestamp: Date.now() }) }
  }
}
