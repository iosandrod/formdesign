import _ from 'lodash-es';
import { nanoid } from './nanoid';

const fieldsRe = /^(input|textarea|number|radio|checkbox|select|time|date|rate|switch|slider|html|cascader|uploadfile|signature|region|subform)$/;
const layoutTypes = /^(grid|tabs|collapse|table|divider)$/;
const excludes = ['grid', 'col', 'table', 'tr', 'td', 'tabs', 'tabsCol', 'collapse', 'collapseCol', 'divider', 'inline'];

const deepTraversal = (node, fn) => {
  fn(node);
  const children = node.type === 'subform' ? node.list[0] : (node.list || node.rows || node.columns || node.children || []);
  children.forEach(child => deepTraversal(child, fn));
};

const wrapElement = (element, fn) => {
  const result = element;
  deepTraversal(result, (node) => {
    if (Array.isArray(node)) return;

    node.style = node.style || {};
    node.id = node.id || nanoid();
    node.key = node.key || `${node.type}_${node.id}`;

    if (layoutTypes.test(node.type)) {
      node.style.width = '100%';
    }

    if (checkIsField(node)) {
      node.style.width = { pc: '100%', mobile: '100%' };
    }

    if (/^(tabs|collapse)$/.test(node.type)) {
      node.columns = new Array(3).fill('').map((_, index) => ({
        ...renderFieldData(`${node.type}Col`),
        label: `Tab ${index + 1}`,
        options: {}
      }));
    }

    fn && fn(node);
  });
  return result;
};

const renderFieldData = (type) => ({
  id: nanoid(),
  type,
  label: '',
  list: [],
  style: {}
});

const flatNodes = (nodes, excludes, fn, excludesFn) => nodes.reduce((res, node, currentIndex) => {
  if (!excludes.includes(node.type)) {
    res.push(node);
    fn && fn(nodes, node, currentIndex);
  } else {
    excludesFn && excludesFn(nodes, node, currentIndex);
  }

  const children = node.type === 'subform' ? node.list[0] : (node.list || node.rows || node.columns || node.children || []);
  return res.concat(flatNodes(children, excludes, fn, excludesFn));
}, []);

const getAllFields = (store) => flatNodes(store, excludes);
const pickfields = (list) => flatNodes(list, excludes);

const processField = (list) => flatNodes(list, excludes, (nodes, node, currentIndex) => {
  nodes[currentIndex] = node.id;
});

const disassemblyData1 = (data) => ({
  list: data.list,
  config: data.config,
  fields: processField(data.list),
  data: data.data,
  logic: data.logic
});

const combinationData1 = (data) => {
  const result = { ...data };
  const fn = (nodes, node, currentIndex) => {
    const cur = _.find(data.fields, { id: node });
    if (!_.isEmpty(cur)) {
      if (cur.type === 'subform') flatNodes(cur.list[0], excludes, fn);
      nodes[currentIndex] = cur;
    }
  };
  flatNodes(data.list, excludes, fn);
  return result;
};

const combinationData2 = (list, fields) => {
  const fn = (nodes, node, currentIndex) => {
    const cur = _.find(fields, { id: node });
    if (!_.isEmpty(cur)) {
      if (cur.type === 'subform') flatNodes(cur.list[0], excludes, fn);
      nodes[currentIndex] = cur;
    }
  };
  flatNodes(list, excludes, fn);
};

const repairLayout = (layout, fields) => {
  flatNodes(layout, excludes, (nodes, node, currentIndex) => {
    if (_.isString(node) && _.find(fields, { id: node })) {
      nodes.splice(currentIndex, 1);
    }
  });

  const temporary = [];
  flatNodes(layout, excludes, null, (nodes, node, currentIndex) => {
    if (node.type === 'inline' && !node.columns.length) {
      temporary.unshift({ nodes, currentIndex });
    }
  });

  temporary.forEach(({ nodes, currentIndex }) => nodes.splice(currentIndex, 1));
};

const disassemblyData2 = (list) => flatNodes(list, excludes, (nodes, node, currentIndex) => {
  nodes[currentIndex] = node.id;
});

const checkIslineChildren = (node) => node.context.parent.type === 'inline';
const checkIsField = (node) => fieldsRe.test(node.type);

const calculateAverage = (count, total = 100) => Array(count).fill(Number((total / count).toFixed(2)));

const syncWidthByPlatform = (node, platform, syncFullplatform = false, value) => {
  const isArray = _.isArray(node);
  const targetNode = isArray ? node : [node];

  targetNode.forEach(n => {
    if (_.isObject(n.style.width)) {
      if (syncFullplatform) {
        n.style.width.pc = n.style.width.mobile = `${value}%`;
      } else {
        n.style.width[platform] = `${value}%`;
      }
    } else {
      n.style.width = `${value}%`;
    }
  });

  const otherNodes = isArray ? [] : node.context.parent.columns.filter(e => e !== node);
  const averageWidths = calculateAverage(otherNodes.length, isArray ? 100 : 100 - value);

  otherNodes.forEach((n, index) => {
    if (_.isObject(n.style.width)) {
      if (syncFullplatform) {
        n.style.width.pc = n.style.width.mobile = `${averageWidths[index]}%`;
      } else {
        n.style.width[platform] = `${averageWidths[index]}%`;
      }
    } else {
      n.style.width = `${averageWidths[index]}%`;
    }
  });
};

const transferLabelPath = (node) => `er.fields.${node.type === 'input' ? `${node.type}.${node.options.renderType - 1}` : node.type}`;
const fieldLabel = (t, node) => t(transferLabelPath(node));

const transferData = (lang, path, locale, options = {}) => _.isEmpty(options)
  ? _.get(locale[lang], path, '')
  : _.template(_.get(locale[lang], path, ''))(options);

const isNull = (e) => e === '' || e === null || e === undefined;

const checkIsInSubform = (node) => {
  let parent = node?.context?.parent;
  while (parent) {
    if (parent.type === 'subform') return true;
    parent = parent.context?.parent;
  }
  return false;
};

const getSubFormValues = (subform) => subform.list.map(e => {
  const cur = {};
  e.forEach(row => row.columns.forEach(col => cur[col.key] = col.options.defaultValue));
  return cur;
});

const findSubFormAllFields = (subform) => subform.list.flatMap(e => e.flatMap(row => row.columns));

export {
  syncWidthByPlatform,
  wrapElement,
  deepTraversal,
  renderFieldData,
  getAllFields,
  disassemblyData1,
  combinationData1,
  disassemblyData2,
  combinationData2,
  checkIslineChildren,
  checkIsField,
  pickfields,
  fieldLabel,
  transferData,
  transferLabelPath,
  isNull,
  repairLayout,
  checkIsInSubform,
  getSubFormValues,
  findSubFormAllFields,
  processField
};
