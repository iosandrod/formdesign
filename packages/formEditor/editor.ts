import _ from 'lodash'
import _utils from "../utils/index";
import { nextTick, reactive, toRef } from 'vue';
let utils: any = _utils
import { globalConfig, fieldsConfig } from './editorData'
import { Node, fieldNode, listNode } from './node'
export class Base {
  constructor(config?: any) {
    return reactive(this)
  }
}
export class Editor extends Base {
  isFoldFields: Boolean = true
  isFoldConfig: Boolean = true
  state: any = {
    store: [],
    selected: {},
    mode: "edit",
    platform: "pc",
    children: [],
    config: {},
    previewVisible: false,
    widthScaleLock: false,
    data: {},
    validateStates: [],
    fields: [],
    Namespace: "formEditor",
    logic: {},
    othersFiles: {},
  }
  isShow: Boolean = false
  isShowConfig: Boolean = false
  props: any = {}
  constructor(config) {
    super()
    this.props = config || {}
    this.state.config = config.globalConfig
  }
  addField(node) {
    let state = this.state
    if (utils.checkIsField(node)) {
      const findIndex = _.findIndex(state.fields, {
        id: node.id,
      });
      if (findIndex === -1) {
        state.fields.push(node);
      } else {
        state.fields.splice(findIndex, 1, node);
      }
    }
  }
  toSelfRef(field: string) {
    //@ts-ignore
    return toRef(this, field)
  }
  delField(node) {
    let state = this.state
    const fieldIndex = _.findIndex(state.fields, {
      id: node.id,
    });
    if (fieldIndex !== -1) {
      if (utils.checkIdExistInLogic(node.id, state.logic)) {
        //显示一下提示框//
        // ElMessage({
        //   showClose: true,
        //   duration: 4000,
        //   message: t("er.logic.logicSuggests"),
        //   type: "warning",
        // });
        utils.removeLogicDataByid(node.id, state.logic);
      }
      state.fields.splice(fieldIndex, 1);
    }
  }
  addFieldData(node, isCopy = false) {
    let state = this.state
    let props = this.props
    if (/^(radio|cascader|checkbox|select)$/.test(node.type)) {
      if (isCopy) {
        state.data[node.id] = _.cloneDeep(state.data[node.options.dataKey]);
        node.options.dataKey = node.id;
      } else {
        if (!state.data[node.id]) {
          node.options.dataKey = node.id;
          state.data[node.id] = {
            type: node.type,
            list: utils.generateOptions(3).map((e, i) => {
              e.label += i + 1;
              return e;
            }),
          };
        }
      }
    }
    if (/^(uploadfile|signature|html)$/.test(node.type)) {
      node.options.action = props.fileUploadURI;
    }
  }
  wrapElement(el, isWrap = true, isSetSelection = true, sourceBlock = true, resetWidth = true) {
  }
  setData(data: any) {
    let state = this.state
    if (_.isEmpty(data)) return false;
    const newData = utils.combinationData1(_.cloneDeep(data));
    this.isShow = false;
    state.store = newData.list;
    state.config = newData.config;
    state.data = newData.data;
    state.fields = newData.fields;
    state.logic = newData.logic;
    this.setSelection(state.config);
    state.store.forEach((e) => {
      utils.addContext(e, state.store);
    });
    nextTick(() => {
      this.isShow = true;//
    });
  }
  setSelection(node) {
    let state = this.state
    let result = "";
    if (node === "root") {
      result = state.config;
    } else {
      if (node.type === "inline") {
        result = node.columns[0];
      } else {
        result = node;
      }
    }
    this.isShowConfig = state.selected === result;
    state.selected = result;
    nextTick(() => {
      this.isShowConfig = true;
    });
  }
  getData(config?: any) {
    let state = this.state
    if (!state.validateStates?.every((e) => !e.isWarning)) return {}
    let data = utils.combinationData2(state.store, state.data, state.logic, state.fields, config)//
    return data
  }
  validateState(target, fn) {
    let state = this.state
    if (target) {
      const count = _.countBy(state.validateStates, "data.key");
      const newValue = target.key.trim();
      if (utils.isNull(newValue)) {
        _.find(state.validateStates, {
          data: { key: target.key },
        }).isWarning = true;
        fn && fn(0);
        return false;
      }
      state.validateStates.forEach((e) => {
        if (count[e.data.key] > 1) {
          e.isWarning = true;
        } else {
          e.isWarning = false;
        }
      });
      if (fn) {
        fn(!(count[newValue] > 1) ? 1 : 2);
      }
    }
  }
  clearState() {
    let state = this.state
  }
}

