import { computed, inject, isRef } from 'vue'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import _ from 'lodash-es'
import Region from '@ER/region/Region'
import { areaList } from '@vant/area-data'
import { useI18n } from '../use-i18n'
import utils from '@ER/utils'

const findPosition = (node, parent) => {
  for (let y = 0; y < parent.list.length; y++) {
    const x = parent.list[y].indexOf(node)
    if (x !== -1) return { x, y }
  }
  return { x: -1, y: -1 }
}

const getLogicStateByField = (field, fieldsLogicState) => {
  const fieldState = fieldsLogicState.get(field) || {}
  return {
    required: fieldState.required,
    readOnly: fieldState.readOnly,
  }
}

const validateField = (node, value, t, state, ExtraParams, reject, resolve) => {
  const { options, type } = node
  const trimmedValue = options.isShowTrim ? value.trim() : value
  const requiredMsg = t('er.validateMsg.required')

  if (type === 'subform') {
    if (state.mode === 'preview' && utils.checkIsInSubform(node)) {
      const parent = node?.context?.parent?.context?.parent
      if (parent) {
        const { required } = getLogicStateByField(parent, state.fieldsLogicState)
        if (required !== undefined) reject(requiredMsg)
      }
    }
    return resolve()
  }

  if (options.required && utils.isEmpty(trimmedValue)) return reject(requiredMsg)

  const validationRules = {
    1: () => trimmedValue.length < options.min && reject(t('er.validateMsg.limitWord', { min: options.min })),
    2: () => !/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(trimmedValue) && reject(t('er.validateMsg.email')),
    3: () => !/^\d{15}|\d{18}$/.test(trimmedValue) && reject(t('er.validateMsg.IdNumber')),
    4: () => !/^\d{11}$/.test(trimmedValue) && reject(t('er.validateMsg.phone')),
    5: () => !/^https?:\/\/[^\s]+$/i.test(trimmedValue) && reject(t('er.validateMsg.http')),
  }

  if (validationRules[options.renderType]) validationRules[options.renderType]()
  resolve()
}

const addValidate = (result, node, isPc, t, state, ExtraParams) => {
  result.rules = [
    {
      required: node.options.required,
      asyncValidator: (...args) =>
        new Promise((resolve, reject) => validateField(node, args[1], t, state, ExtraParams, reject, resolve)),
    },
  ]
}

export const useProps = (state, data, isPc = true, isRoot = false, specialHandling, t, ExtraParams) => {
  t = t || useI18n().t
  ExtraParams = ExtraParams || inject('EverrightExtraParams', {})

  return computed(() => {
    let node = isRoot ? data.config : data
    if (isRef(data)) node = data.value
    if (isRoot) return isPc ? { model: data.store, size: node.pc.size, labelPosition: node.pc.labelPosition } : { labelAlign: node.mobile.labelPosition }

    const { options, type } = node
    const baseProps = {
      label: options.isShowLabel ? node.label : '',
      disabled: options.disabled,
      placeholder: options.placeholder,
      clearable: options.clearable,
      required: options.required,
    }

    if (state.mode === 'preview') {
      const { readOnly, required } = getLogicStateByField(node, state.fieldsLogicState)
      baseProps.disabled = readOnly === 1
      baseProps.required = baseProps.disabled ? false : required === 1
    }

    const componentProps = {
      input: () => ({
        showPassword: options.showPassword,
        maxlength: options.isShowWordLimit ? options.max : undefined,
        prepend: isPc ? options.prepend : undefined,
        append: isPc ? options.append : undefined,
      }),
      textarea: () => ({
        type: 'textarea',
        rows: options.rows,
        maxlength: options.isShowWordLimit ? options.max : undefined,
      }),
      number: () => ({
        controls: isPc ? options.controls : undefined,
        step: options.step,
        precision: options.precision,
        min: options.isShowWordLimit ? options.min : Number.NEGATIVE_INFINITY,
        max: options.isShowWordLimit ? options.max : Number.POSITIVE_INFINITY,
      }),
      radio: () => ({ options: _.get(state, `data[${options.dataKey}].list`, []) }),
      checkbox: () => ({ options: _.get(state, `data[${options.dataKey}].list`, []) }),
      select: () => ({
        options: _.get(state, `data[${options.dataKey}].list`, []),
        multiple: options.multiple,
        filterable: options.filterable,
      }),
      time: () => ({ format: options.format, valueFormat: isPc ? options.valueFormat : undefined }),
      date: () => ({
        format: options.format,
        valueFormat: isPc ? 'X' : undefined,
        placeholder: options.placeholder,
        disabledDate: isPc
          ? (time) => {
              const startDate = dayjs.unix(options.startTime)
              const endDate = dayjs.unix(options.endTime)
              const currentDate = dayjs(time)
              return options.isShowWordLimit && (currentDate.isBefore(startDate) || currentDate.isAfter(endDate))
            }
          : undefined,
      }),
      slider: () => ({ step: options.step, min: options.min, max: options.max }),
      rate: () => ({ allowHalf: options.allowHalf, max: isPc ? options.max : undefined, count: isPc ? undefined : options.max }),
      uploadfile: () => ({
        multiple: options.multiple,
        action: options.action,
        accept: options.accept,
        maxSize: options.size * 1024 * 1024,
        ...(isPc ? { limit: options.limit } : { maxCount: options.limit, onOversize: () => showToast(t('er.validateMsg.fileSize', { size: options.size })) }),
      }),
      region: () => (isPc ? { options: new Region(areaList, { selectType: options.selectType }).getAll(), props: { emitPath: false } } : { areaList, columnsNum: options.selectType }),
    }

    addValidate(baseProps, node, isPc, t, state, ExtraParams)
    specialHandling && specialHandling(type, baseProps)

    return { ...baseProps, ...(componentProps[type]?.() || {}) }
  })
}
