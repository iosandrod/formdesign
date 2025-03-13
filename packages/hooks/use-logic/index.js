import { watch } from 'vue';
import _ from 'lodash-es';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import utils from '@ER/utils';
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const findValidityRule = (state) => {
  return _.mapValues(state.logic, (filters) =>
    filters.map(filter => ({
      if: _.get(filter, 'ifRules.filters[0]', {}),
      then: _.get(filter, 'thenRules.filters[0]', {})
    }))
  );
};

const findFieldsById = (list, fields) => _.intersectionBy(fields, list.map(id => ({ id })), 'id');

const getAreaType = (code) => {
  const val = String(code);
  return val[0] !== '0' && val[2] === '0' ? 1 : val[2] !== '0' && val[4] === '0' ? 2 : 3;
};

const compare = (logicValue, value, field, method) => {
  if (field.type === 'date' || field.type === 'time') {
    return dayjs(value, field.options?.valueFormat).isSame(dayjs(logicValue, field.options?.valueFormat), method);
  }
  return _.isEqual(logicValue, value);
};

const conditions = {
  equal: compare,
  notEqual: (...args) => !compare(...args),
  contains: (logicValue, value) => _.some(logicValue, v => _.includes(value, v)),
  notContains: (...args) => !conditions.contains(...args),
  empty: (logicValue, value, field) => (field.type === 'rate' ? value === 0 : utils.isEmpty(value)),
  notEmpty: (...args) => !conditions.empty(...args),
  gt: (logicValue, value) => _.gt(value, logicValue),
  gte: (logicValue, value) => _.gte(value, logicValue),
  lt: (logicValue, value) => _.lt(value, logicValue),
  lte: (logicValue, value) => _.lte(value, logicValue),
  between: (logicValue, value, field) => conditions.lte(logicValue[1], value, field) && conditions.gte(logicValue[0], value, field),
  oneOf: (logicValue, value) => _.includes(logicValue, value),
  notOneOf: (...args) => !conditions.oneOf(...args),
  belongOneOf: (logicValue, value) => logicValue.some(code => getAreaType(code) === getAreaType(value)),
  notBelongOneOf: (...args) => !conditions.belongOneOf(...args)
};

const changeState = (state, field, key, value) => (state.has(field) ? state.get(field)[key] = value : state.set(field, { [key]: value }));

const operateCondition = (isValidation, rule, fields, state, key, trueVal, falseVal) => {
  findFieldsById(_.get(rule, 'then.conditions[0].value', []), fields).forEach(field => {
    changeState(state, field, key, isValidation ? trueVal : falseVal);
  });
};

const listenEvent = (state) => {
  _.forEach(findValidityRule(state), (rules, type) => {
    rules.forEach(rule => {
      const targetFields = findFieldsById(_.map(rule.if.conditions, 'property'), state.fields);
      watch(() => targetFields.map(e => e.options.defaultValue), (values) => {
        const isValid = rule.if.logicalOperator === 'and' ? values.every((v, i) => conditions[rule.if.conditions[i].operator](rule.if.conditions[i].value, v, targetFields[i])) : values.some((v, i) => conditions[rule.if.conditions[i].operator](rule.if.conditions[i].value, v, targetFields[i]));
        const ops = { visible: [1, 0], required: [1, 0], readOnly: [1, 0] };
        if (ops[type]) operateCondition(isValid, rule, state.fields, state.fieldsLogicState, type, ...ops[type]);
      }, { immediate: true, deep: true });
    });
  });
};

export const useLogic = (state) => watch(() => state.logic, () => listenEvent(state));
