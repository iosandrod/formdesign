import { withModifiers, resolveComponent, ref, useSlots, onMounted, useAttrs, unref, onBeforeUnmount, inject, computed } from 'vue'
import { isHTMLTag } from '@vue/shared'
import hooks from '@ER/hooks'
import utils from '@ER/utils'
import Icon from '@ER/icon'
import _ from 'lodash'

export default {
  name: 'SelectElement',
  inheritAttrs: false,
  props: {
    data: Object,
    tag: { type: String, default: 'div' },
    parent: Object,
    hasMask: Boolean,
    hasDrag: Boolean,
    hasDel: Boolean,
    hasCopy: Boolean,
    hasTableCellOperator: Boolean,
    hasWidthScale: Boolean,
    hasInserColumn: Boolean,
    hasInserRow: Boolean,
    hasAddCol: Boolean
  },
  setup(props) {
    const ER = inject('Everright')
    const { t } = hooks.useI18n()
    const ns = hooks.useNamespace('selectElement')
    const isHover = ref(false)
    const isInlineChildren = utils.checkIslineChildren(props.data)
    const { setSelection, state, isEditModel, isPc, target } = hooks.useTarget()
    const id = hooks.useCss(props.data, state.platform)
    const visible = ref(false)
    const isWarning = ref(false)
    const isField = utils.checkIsField(props.data)

    const handleClick = e => setSelection(props.data)

    if (props.data.type && isField) {
      state.validateStates.push({ data: props.data, isWarning })
    }
    onBeforeUnmount(() => {
      const index = _.findIndex(state.validateStates, { data: { id: props.data.id } })
      if (index !== -1) state.validateStates.splice(index, 1)
    })
    const handleCommand = command => props.data.context[command.split(' ')[0]](command.split(' ')[1])
    const renderTableCellOperator = () => {
      if (!visible.value) return ''
      return (
        <el-dropdown trigger="hover" onCommand={handleCommand} onVisible-change={val => visible.value = val}>
          <Icon class={[ns.e('tableOperator')]} icon="tableOperation" />
          <el-dropdown-menu>
            {['left', 'right', 'top', 'bottom'].map(position => (
              <el-dropdown-item command={`insert ${position}`}>{t(`er.selection.insert${position.charAt(0).toUpperCase() + position.slice(1)}`)}</el-dropdown-item>
            ))}
            {['left', 'right', 'row', 'top', 'bottom', 'column'].map(direction => (
              <el-dropdown-item command={`merge ${direction}`} disabled={props.data.context[`isDisableMarge${direction.charAt(0).toUpperCase() + direction.slice(1)}`]}>
                {t(`er.selection.merge${direction.charAt(0).toUpperCase() + direction.slice(1)}`)}
              </el-dropdown-item>
            ))}
            {['row', 'column', 'splitRow', 'splitColumn'].map(action => (
              <el-dropdown-item command={`del ${action}`} disabled={props.data.context[`isDisableDel${action.charAt(0).toUpperCase() + action.slice(1)}`]}>
                {t(`er.selection.del${action.charAt(0).toUpperCase() + action.slice(1)}`)}
              </el-dropdown-item>
            ))}
          </el-dropdown-menu>
        </el-dropdown>
      )
    }
    const handleAction = type => {
      const index = type !== 5 && props.parent.indexOf(props.data)
      const actionMap = {
        1: () => {
          if (ER.props.delHandle(props.data) === false) return
          props.data.context.delete()
          utils.deepTraversal(props.data, node => utils.checkIsField(node) && ER.delField(node))
          if (/^(radio|checkbox|select)$/.test(props.data.type)) delete state.data[props.data.options.dataKey]
          setSelection(props.parent[index] || 'root')
        },
        2: () => {
          if (ER.props.copyHandle(props.data) === false) return
          props.data.context.copy()
          const copyData = props.parent[index + 1]
          setSelection(copyData)
          utils.deepTraversal(copyData, node => { ER.addFieldData(node, true); if (utils.checkIsField(node)) ER.addField(node) })
        },
        3: () => _.last(props.data.context.columns[0]).context.insert('bottom'),
        4: () => _.last(props.data.context.columns)[0].context.insert('right'),
        5: () => setSelection(Array.isArray(props.data.context.parent) ? 'root' : props.data.context.parent),
        6: () => props.data.context.appendCol()
      }
      let method = actionMap[type]
      console.log(method, 'testMethod')//
      actionMap[type]?.()
    }
    const elementRef = ref()
    const widthScaleElement = ref()
    const isScale = ref(false)

    const isShowWidthScale = computed(() => props.hasWidthScale && !(ER.props.layoutType === 1 && !isPc.value))
    const isShowCell = ref(false)
    // onMounted(() => {
    //   if (!unref(isEditModel)) return
    //   const hoverEl = elementRef.value.$el || elementRef.value
    //   hoverEl.addEventListener('mouseover', e => {
    //     if (!state.widthScaleLock) isHover.value = true
    //     e.stopPropagation()
    //   })
    //   hoverEl.addEventListener('mouseout', e => {
    //     if (!visible.value) isHover.value = false
    //     e.stopPropagation()
    //   })
    //   if (isShowWidthScale.value) {
    //     widthScaleElement.value.addEventListener('mousedown', e => {
    //       e.preventDefault()
    //       console.log('mouse down 111')//
    //       const columnWidth = hoverEl.offsetParent.offsetWidth / 24
    //       state.widthScaleLock = isScale.value = true
    //       const oldX = e.clientX
    //       const oldWidth = hoverEl.offsetWidth
    //       const onMouseMove = e => {
    //         let offset = Math.ceil((oldWidth + Math.round((e.clientX - oldX) / columnWidth) * columnWidth) / columnWidth)
    //         offset = Math.min(24, Math.max(6, offset))
    //         props.data.options.span = offset
    //         // console.log(props.data, 'testData')//
    //       }
    //       const onMouseUp = () => {
    //         document.removeEventListener('mouseup', onMouseUp)
    //         document.removeEventListener('mousemove', onMouseMove)
    //         state.widthScaleLock = isScale.value = false
    //       }
    //       document.addEventListener('mouseup', onMouseUp)
    //       document.addEventListener('mousemove', onMouseMove)
    //     })
    //   }
    // })
      onMounted(() => {
          if (!unref(isEditModel)) return false
          const hoverEl = elementRef.value.$el || elementRef.value
          const widthScaleEl = widthScaleElement.value
          hoverEl.addEventListener('mouseover', (e) => {
            if (!state.widthScaleLock) {
              isHover.value = true
            }
            e.stopPropagation()
          })
          hoverEl.addEventListener('mouseout', (e) => {
            // console.log(elementRef.value.contains(e.target))
            if (isShowCell.value) return false
            isHover.value = false
            e.stopPropagation()
          })
          if (isShowWidthScale.value) {
            // if (!hoverEl.offsetParent) return false
            widthScaleEl.addEventListener('mousedown', (e) => {
              e.preventDefault()
              const columnWidth = hoverEl.offsetParent.offsetWidth / 24
              state.widthScaleLock = isScale.value = true
              const oldX = e.clientX
              const oldWidth = hoverEl.offsetWidth
              const onMouseMove = (e) => {
                if (!isInlineChildren) {
                  let offset = Math.ceil((oldWidth + Math.round((e.clientX - oldX) / columnWidth) * columnWidth) / columnWidth)
                  if (offset >= 24) {
                    offset = 24
                  }
                  if (offset <= 6) {
                    offset = 6
                  }
                  props.data.options.span = offset
                } else {
                  const curNewWidth = oldWidth + e.clientX - oldX
                  let curWidth = Math.round(curNewWidth / hoverEl.parentNode.offsetWidth * 100)
                  if (curWidth <= 25) {
                    curWidth = 25
                  }
                  utils.syncWidthByPlatform(props.data, state.platform, false, curWidth)
                }
              }
              const onMouseUp = () => {
                document.removeEventListener('mouseup', onMouseUp)
                document.removeEventListener('mousemove', onMouseMove)
                state.widthScaleLock = isScale.value = false
              }
              document.addEventListener('mouseup', onMouseUp)
              document.addEventListener('mousemove', onMouseMove)
            })
          }
        })
    const isShowCopy = computed(() => isInlineChildren ? props.hasCopy && props.data.context.parent.columns.length < ER.props.inlineMax : props.hasCopy)
    const TagComponent = isHTMLTag(props.tag) ? props.tag : resolveComponent(props.tag)
    const maskNode = (
      <div class={[ns.e('mask')]}>
      </div>
    )
    const Selected = computed(() => target.value.id === props.data.id && ns.is('Selected'))
    return () => (
      <TagComponent class={id.value} {...useAttrs()} class={[
        ns.b(), unref(isEditModel) && ER.props.dragMode === 'full' && props.hasDrag && 'ER-handle',
        !isField && ns.e('borderless'), unref(isEditModel) && ns.e('editor'), unref(isEditModel) && Selected.value,
        unref(isEditModel) && isHover.value && ns.e('hover'), unref(isEditModel) && isScale.value && ns.e('isScale'),
        unref(isEditModel) && isWarning.value && ns.is('Warning')
      ]} ref={elementRef} onClick={unref(isEditModel) && withModifiers(handleClick, ['stop'])}>
        {useSlots().default()}
        {!isPc.value && <span />}
        {unref(isEditModel) && ER.props.dragMode === 'icon' && <div class={[ns.e('topLeft')]}>{props.hasDrag && <Icon class={['ER-handle', ns.e('dragIcon')]} icon="Rank" />}</div>}
        {unref(isEditModel) && <div class={[ns.e('bottomRight')]}>
          <Icon class={['handle', ns.e('selectParent')]} onClick={withModifiers(() => handleAction(5), ['stop'])} icon="top" />
          {props.hasDel && <Icon class={[ns.e('copy')]} onClick={withModifiers(() => handleAction(1), ['stop'])} icon="delete" />}
          {props.hasInserColumn && <Icon class={[ns.e('charulieIcon')]} onClick={withModifiers(() => handleAction(4), ['stop'])} icon="tableInsertCol" />}
          {props.hasInserRow && <Icon class={[ns.e('charuhangIcon')]} onClick={withModifiers(() => handleAction(3), ['stop'])} icon="tableInsertRow" />}
          {props.hasAddCol && <Icon class={[ns.e('addCol')]} onClick={withModifiers(() => handleAction(6), ['stop'])} icon="plus" />}
          {isShowWidthScale.value && <div ref={widthScaleElement}><Icon class={[ns.e('widthScale')]} icon="dragWidth" /></div>}
          {props.hasTableCellOperator && renderTableCellOperator()}
        </div>}
        {unref(isEditModel) && props.hasMask && <div class={[ns.e('mask')]} />}
      </TagComponent>
    )
    // return () => {
    //   const slots = useSlots()
    //   return (
    //     <TagComponent
    //       class={id.value}
    //       {...useAttrs()}
    //       class={[
    //         ns.b(),
    //         unref(isEditModel) && ER.props.dragMode === 'full' && props.hasDrag && 'ER-handle',
    //         !isField && ns.e('borderless'),
    //         unref(isEditModel) && ns.e('editor'),
    //         unref(isEditModel) && Selected.value,
    //         unref(isEditModel) && isHover.value && ns.e('hover'),
    //         unref(isEditModel) && isScale.value && ns.e('isScale'),
    //         unref(isEditModel) && isWarning.value && ns.is('Warning')
    //       ]}
    //       ref={elementRef} onClick={unref(isEditModel) && withModifiers(handleClick, ['stop'])}
    //     >
    //       {slots.default()}
    //       {!isPc.value && (<span></span>)}
    //       {
    //         ER.props.dragMode === 'icon' &&
    //         unref(isEditModel) && (
    //           <div class={[ns.e('topLeft')]}>
    //             {props.hasDrag && (<Icon class={['ER-handle', ns.e('dragIcon')]} icon="Rank"></Icon>)}
    //           </div>
    //         )
    //       }
    //       {
    //         unref(isEditModel) && (
    //           <div class={[ns.e('bottomRight')]}>
    //             {/* {isShowSelectParent.value && (<Icon class={['handle', ns.e('selectParent')]} icon="top"></Icon>)} */}
    //             <Icon class={['handle', ns.e('selectParent')]} onClick={withModifiers((e) => {
    //               handleAction(5)
    //             }, ['stop'])} icon="top"></Icon>
    //             {props.hasDel && (
    //               <Icon class={[ns.e('copy')]} onClick={withModifiers((e) => {
    //                 handleAction(1)
    //               }, ['stop'])} icon="delete"></Icon>
    //             )}
    //             {
    //               props.hasInserColumn && (<Icon class={[ns.e('charulieIcon')]} onClick={withModifiers((e) => {
    //                 handleAction(4)
    //               }, ['stop'])} icon="tableInsertCol"></Icon>)
    //             }
    //             {
    //               props.hasInserRow && (<Icon class={[ns.e('charuhangIcon')]} onClick={withModifiers((e) => {
    //                 handleAction(3)
    //               }, ['stop'])} icon="tableInsertRow"></Icon>)
    //             }
    //             {
    //               props.hasAddCol && (<Icon class={[ns.e('addCol')]} onClick={withModifiers((e) => {
    //                 handleAction(6)
    //               }, ['stop'])} icon="plus"></Icon>)
    //             }
    //             {
    //               isShowCopy.value && (<Icon class={[ns.e('copyIcon')]} onClick={withModifiers((e) => {
    //                 handleAction(2)
    //               }, ['stop'])} icon="copy"></Icon>)
    //             }
    //             {isShowWidthScale.value && (
    //               <div ref={widthScaleElement}><Icon class={[ns.e('widthScale')]} icon="dragWidth"></Icon></div>)}
    //             {props.hasTableCellOperator && renderTableCellOperator()}
    //           </div>
    //         )
    //       }

    //       {
    //         unref(isEditModel) && props.hasMask && maskNode
    //       }
    //     </TagComponent>
    //   )
    // }
  }
}
