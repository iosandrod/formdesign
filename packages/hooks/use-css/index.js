import { ref, getCurrentInstance, watch } from 'vue'
import _ from 'lodash-es'
import jss from 'jss'
import preset from 'jss-preset-default'

jss.setup({ ...preset(), insertionPoint: document.getElementById('Everright-formEditor-point') })
const sheet = jss.createStyleSheet({}, { classNamePrefix: 'ER-' }).attach()

const isShowKeys = ['padding', 'margin', 'border', 'background']

const renderTableBorder = (style) => {
  const value = { width: style.borderWidth, style: 'solid', color: style.borderColor }
  const borderStyles = {
    1: { '&>table': { border: value, '& td': { border: value } } },
    2: { '&>table': { border: value, '& td': { border: { style: 'none' } } } },
    3: { '&>table': { border: { style: 'none' }, '& td:not(:last-child)': { borderRight: value }, '& tr:not(:last-child) td': { borderBottom: value } } },
    4: { '&>table': { border: { style: 'none' }, borderLeft: value, '& td': { border: { style: 'none' } } } },
    5: { '&>table': { border: { style: 'none' }, borderRight: value, '& td': { border: { style: 'none' } } } },
    6: { '&>table': { border: { style: 'none' }, borderTop: value, '& td': { border: { style: 'none' } } } },
    7: { '&>table': { border: { style: 'none' }, borderBottom: value, '& td': { border: { style: 'none' } } } }
  }
  return borderStyles[style.borderType] || {}
}
const renderStyleSheets = (node, uid, platform) => {
  const style = _.cloneDeep(node.style)
  isShowKeys.forEach((key) => {
    const showKey = `isShow${_.upperFirst(key)}`
    if (key === 'border' && node.type === 'table' && style[showKey]) {
      Object.assign(style, renderTableBorder(node.style))
    } else if (!style[showKey]) {
      delete style[key]
      if (key === 'border') delete style.borderRadius
      delete style[showKey]
    }
  })
  if (_.isObject(style.width)) style.width = style.width[platform]
  if (style.background?.image) style.background.image = `url(${style.background.image})`
  return sheet.addRule(uid.toString(), style).id
}

export const useCss = (node, platform) => {
  const { uid } = getCurrentInstance()
  const id = ref('')

  if (node.style) {
    watch(node.style, (newValue) => {
      if (!_.isEmpty(newValue)) id.value = renderStyleSheets(node, uid, platform)
    }, { immediate: true })
  }
  return id
}
