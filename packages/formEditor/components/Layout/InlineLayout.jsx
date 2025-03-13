import { defineComponent, watch, inject } from 'vue'
import LayoutDragGable from './DragGable.jsx'
import hooks from '@ER/hooks'
import utils from '@ER/utils'

export default defineComponent({
  name: 'InlineLayout',
  props: {
    data: Object,
    parent: Array
  },
  setup(props) {
    const ER = inject('Everright')
    const ns = hooks.useNamespace('InlineLayout')
    // Watch for column length changes to sync width or delete context when no columns are present
    watch(() => props.data.columns.length, (newVal, oldVal) => {
      if (!newVal) {
        props.data.context.delete()
      } else if (newVal !== oldVal) {
        utils.syncWidthByPlatform(props.data.columns, ER.state.platform, ER.props.layoutType === 1)
      }
    })
    return () => (
      <div class={ns.b()}>
        <LayoutDragGable
          data-layout-type="inline"
          type="inline"
          direction="horizontal"
          data={props.data.columns}
          parent={props.parent}
        />
      </div>
    )
  }
})
