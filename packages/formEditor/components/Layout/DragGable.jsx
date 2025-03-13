import { defineComponent, resolveComponent, useAttrs, useSlots, unref, inject } from 'vue'
import DragGable from 'vuedraggable'
import _ from 'lodash-es'
import hooks from '@ER/hooks'
import LayoutGridLayout from './GridLayout'
import LayoutTabsLayout from './TabsLayout'
import LayoutCollapseLayout from './CollapseLayout'
import LayoutTableLayout from './TableLayout'
import LayoutInlineLayout from './InlineLayout'
import LayoutSubformLayout from './SubformLayout'
import { defineAsyncComponent } from 'vue'
import Selection from '@ER/formEditor/components/Selection/selectElement.jsx'
import ControlInsertionPlugin from './ControlInsertionPlugin'
import { isHTMLTag } from '@vue/shared'

const dragGableWrap = defineComponent({
  inheritAttrs: false,
  name: 'customDragGable',
  components: { DragGable },
  setup() {
    const { isEditModel } = hooks.useTarget()
    return () => {
      const attrs = useAttrs()
      let _tag = attrs.tag
      let TagComponent = null // resolve the component before rendering
      if (isHTMLTag(_tag)) {
        TagComponent = _tag
      } else {
        TagComponent = resolveComponent(attrs.tag)
      }
      const node = unref(isEditModel)
        ? <dragGable {...attrs}>{useSlots()}</dragGable>
        : <TagComponent {...attrs.componentData}>
          {attrs.list.map(e => useSlots().item({ element: e }))}
        </TagComponent>
      return node
    }
  }
})

export {
  dragGableWrap
}

export default defineComponent({
  name: 'DragGableLayout',
  props: {
    isRoot: { type: Boolean, default: false },
    data: Object,
    parent: Object,
    tag: { type: String, default: 'div' },
    type: String
  },
  setup(props) {
    const ER = inject('Everright')
    const { state, isEditModel, isPc } = hooks.useTarget()
    const ns = hooks.useNamespace('DragGableLayout')

    const dragOptions = {
      swapThreshold: 1,
      group: { name: 'er-Canves' },
      parent: props.parent,
      plugins: [ControlInsertionPlugin(ER)],
      ControlInsertion: true
    }

    const componentMap = {}

    const findComponent = (type, element) => {
      const key = `${type}${element}`
      if (!componentMap[key]) {
        componentMap[key] = defineAsyncComponent(() => import(`../${type}/${_.startCase(element)}/${state.platform}.vue`))
      }
      return componentMap[key]
    }

    const slots = {
      item: ({ element }) => {
        if (element.type === 'subform' && (unref(isEditModel) || _.get(state.fieldsLogicState.get(element), 'visible') === 0)) return null
        const LayoutMap = {
          grid: LayoutGridLayout,
          table: LayoutTableLayout,
          tabs: LayoutTabsLayout,
          collapse: LayoutCollapseLayout,
          inline: LayoutInlineLayout
        }
        let node
        if (LayoutMap[element.type]) {
          const LayoutComponent = LayoutMap[element.type]
          node = <LayoutComponent key={element.id} data={element} parent={props.data} />
        } else {
          const TypeComponent = findComponent('FormTypes', element.type)
          const typeProps = hooks.useProps(state, element, unref(isPc))
          node = (
            <Selection hasWidthScale hasCopy hasDel hasDrag hasMask data={element} parent={props.data} key={element.id}>
              <el-form-item {...typeProps.value}>
                <TypeComponent data={element} params={typeProps.value} />
              </el-form-item>
            </Selection>
          )
        }
        return node
      },
      footer: () => (!_.isEmpty(props.data) || props.isRoot) ? '' : <div class={ns.e('dropHere')}>Drop here</div>
    }

    return () => (
      <dragGableWrap
        list={props.data}
        handle=".ER-handle"
        class={[ns.b(), unref(isEditModel) && ns.e('edit')]}
        tag={props.tag}
        item-key="id"
        move={() => true}
        {...dragOptions}
        v-slots={slots}
        componentData={useAttrs()}
      />
    )
  }
})
