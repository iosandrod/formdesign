import { defineComponent, inject, resolveComponent, unref } from 'vue'
import LayoutDragGable from '@ER/formEditor/components/Layout/DragGable'
import CompleteButton from '@ER/formEditor/components/CompleteButton.vue'
import hooks from '@ER/hooks'
import _ from 'lodash-es'

export default defineComponent({
  name: 'Canves/.',
  inheritAttrs: false,
  setup() {
    const ER = inject('Everright')
    const ns = hooks.useNamespace('Canves')
    const { state, setSelection, isEditModel, isPc } = hooks.useTarget()

    const handleClick = () => setSelection('root')

    const renderContent = () => {
      const TagComponent = resolveComponent(unref(isPc) ? 'el-form' : 'van-form')
      const typeProps = hooks.useProps(state, state, unref(isPc), true)

      return (
        <div>
          <TagComponent ref={ER.form} onClick={unref(isEditModel) && handleClick} {...typeProps.value}>
            <LayoutDragGable
              data-layout-type="root"
              class={unref(isEditModel) && ns.e('wrap')}
              data={state.store}
              parent={state.store}
              isRoot
            />
          </TagComponent>
          {!unref(isEditModel) && !_.isEmpty(state.config) && ER.props.isShowCompleteButton && <CompleteButton handle={ER.form} />}
        </div>
      )
    }

    return () => (
      <ElMain
        class={[
          ns.b(),
          unref(isEditModel) && ns.e('editModel'),
          !unref(isPc) && ns.e('mobile'),
          !unref(isPc) && ns.e(`mobile_layoutType${ER.props.layoutType}`)
        ]}
      >
        {unref(isEditModel) ? (
          <div class={ns.e('container')}>
            <el-scrollbar ref={ER.canvesScrollRef}>
              <div class={ns.e('subject')}>{renderContent()}</div>
            </el-scrollbar>
          </div>
        ) : (
          renderContent()
        )}
      </ElMain>
    )
  }
})
