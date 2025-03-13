import { defineComponent, resolveComponent, useAttrs, inject } from 'vue'
import hooks from '@ER/hooks'
import Selection from '@ER/formEditor/components/Selection/selectElement.jsx'
import LayoutDragGable from './DragGable.jsx'

export default defineComponent({
  name: 'GridLayout',
  inheritAttrs: false,
  props: {
    data: Object,
    parent: Array
  },
  setup(props) {
    const ns = hooks.useNamespace('GridLayout')
    const { state, isPc } = hooks.useTarget()
    const tag = resolveComponent('el-row')
    return () => (
      <Selection {...useAttrs()} hasWidthScale hasCopy hasAddCol hasDel hasDrag data={props.data} parent={props.parent}>
        <tag
          data-layout-type="grid"
          gutter={props.data.options.gutter}
          justify={props.data.options.justify}
          align={props.data.options.align}
          class={[ns.b()]}
        >
          {props.data.columns.map((element) => (
            <Selection
              key={element.id}
              hasCopy
              hasDel={props.data.columns.length > 1}
              hasWidthScale
              data-layout-type="grid-col"
              tag="el-col"
              class={[ns.e('area')]}
              span={element.options.span}
              offset={element.options.offset}
              pull={element.options.pull}
              push={element.options.push}
              data={element}
              parent={props.data.columns}
            >
              <LayoutDragGable
                data={element.list}
                data-layout-type="grid-col"
                parent={element}
                ControlInsertion={true}
              />
            </Selection>
          ))}
        </tag>
      </Selection>
    )
  }
})
