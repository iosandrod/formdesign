import { computed, inject } from 'vue'
import locale from '@ER/formEditor/locale'
import utils from '@ER/utils'

export const useI18n = (props) => {
  const ER = inject('Everright', { props })
  const lang = computed(() => {
    return ER.props.lang
  })
  return {
    lang,
    t (path, options) {
      return utils.transferData(lang.value, path, locale, options)
    }
  }
}
