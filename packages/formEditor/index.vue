<script>
import { ClickOutside as vClickOutside, ElMessage } from "element-plus";
import {
  defineProps,
  ref,
  reactive,
  computed,
  provide,
  getCurrentInstance,
  nextTick,
  onMounted,
  watch,
} from "vue";
import FieldsPanel from "@ER/formEditor/components/Panels/Fields";
import CanvesPanel from "@ER/formEditor/components/Panels/Canves";
import ConfigPanel from "@ER/formEditor/components/Panels/Config/index.vue";
import DeviceSwitch from "@ER/formEditor/components/DeviceSwitch.vue";
import erFormPreview from "./preview.vue";
import Icon from "@ER/icon";
import hooks from "@ER/hooks";
import utils from "@ER/utils";
import _ from "lodash-es";
import defaultProps from "./defaultProps";
import generatorData from "./generatorData";
export default {
  name: "Everright-form-editor",
};
</script>
<script setup>
import { staticData } from "./testData";
import { Editor } from "./editor";
const emit = defineEmits(["listener"]);
console.log(staticData.list, "testList111"); //
const props = defineProps(
  _.merge(
    {
      fieldsPanelWidth: {
        type: String,
        default: "220px",
      },
      fieldsPanelDefaultOpeneds: {
        type: Array,
        default: () => ["defaultField", "field", "container"],
      },
      delHandle: {
        type: Function,
        default: () => {},
      },
      copyHandle: {
        type: Function,
        default: () => {},
      },
      inlineMax: {
        type: Number,
        default: 4,
      },
      isShowClear: {
        type: Boolean,
        default: true,
      },
      isShowI18n: {
        type: Boolean,
        default: true,
      },
      dragMode: {
        type: String,
        default: "icon",
        validator: (value) => ["full", "icon"].includes(value),
      },
      checkFieldsForNewBadge: {
        type: Function,
        default: () => {},
      },
    },
    defaultProps
  )
);
const layout = {
  pc: [],
  mobile: [],
};
const myEditor = new Editor(props);
const form = ref("");
const previewPlatform = ref("pc");
const previewLoading = ref(true);
const state = myEditor.state;
// const isFoldFields = ref(true);
// const isFoldConfig = ref(true);
const isFoldFields = myEditor.toSelfRef("isFoldFields");
const isFoldConfig = myEditor.toSelfRef("isFoldConfig");
state.validator = (target, fn) => {
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
  } else {
    fn(state.validateStates.every((e) => !e.isWarning));
  }
};

const { t, lang } = hooks.useI18n(props);
const EReditorPreviewRef = ref("");
const isShow = myEditor.toSelfRef("isShow");
const isShowConfig = myEditor.toSelfRef("isShowConfig");
const setSelection = (node) => {
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
  isShowConfig.value = state.selected === result;
  state.selected = result;
  nextTick(() => {
    isShowConfig.value = true;
  });
};
setSelection(state.config);
const addField = (node) => {
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
};
const delField = (node) => {
  const fieldIndex = _.findIndex(state.fields, {
    id: node.id,
  });
  if (fieldIndex !== -1) {
    if (utils.checkIdExistInLogic(node.id, state.logic)) {
      ElMessage({
        showClose: true,
        duration: 4000,
        message: t("er.logic.logicSuggests"),
        type: "warning",
      });
      utils.removeLogicDataByid(node.id, state.logic);
    }
    state.fields.splice(fieldIndex, 1);
  }
};
const addFieldData = (node, isCopy = false) => {
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
};
const wrapElement = (
  el,
  isWrap = true,
  isSetSelection = true,
  sourceBlock = true,
  resetWidth = true
) => {
  const node = sourceBlock
    ? generatorData(el, isWrap, lang.value, sourceBlock, (node) => {
        addFieldData(node);
        addField(node);
      })
    : isWrap
    ? {
        type: "inline",
        columns: [el],
      }
    : el;
  if (!sourceBlock && resetWidth) {
    if (utils.checkIsField(el)) {
      if (state.platform === "pc") {
        el.style.width.pc = "100%";
      } else {
        el.style.width.mobile = "100%";
      }
      // el.style.width = {
      //   pc: '100%',
      //   mobile: '100%'
      // }
    } else {
      el.style.width = "100%";
    }
  }
  if (isSetSelection) {
    // nextTick(() => {
    //   setSelection(node)
    // })
  }
  return node;
};
const syncLayout = (platform, fn) => {
  const isPc = platform === "pc";
  const original = _.cloneDeep(state.store);
  utils.disassemblyData2(original);
  layout[isPc ? "mobile" : "pc"] = original;
  if (_.isEmpty(isPc ? layout.pc : layout.mobile)) {
    // const newData = _.cloneDeep(state.fields.map(e => wrapElement(e, true, false)))
    const newData = state.fields
      .filter((field) => !utils.checkIsInSubform(field))
      .map((e) => wrapElement(e, true, false, false, false));
    fn && fn(newData);
  } else {
    // debugger
    const layoutFields = utils
      .pickfields(isPc ? layout.pc : layout.mobile)
      .map((e) => {
        return {
          id: e,
        };
      });
    const copyData = _.cloneDeep(isPc ? layout.pc : layout.mobile);
    const addFields = _.differenceBy(
      state.fields.filter((field) => !utils.checkIsInSubform(field)),
      layoutFields,
      "id"
    );
    const delFields = _.differenceBy(layoutFields, state.fields, "id");
    utils.repairLayout(copyData, delFields);
    // console.log(JSON.stringify(copyData, '', 2))
    utils.combinationData2(copyData, state.fields);
    // console.log(JSON.stringify(copyData, '', 2))
    copyData.push(
      ...addFields.map((e) => wrapElement(e, true, false, false, false))
    );
    // copyData.push(...addFields)
    fn && fn(copyData);
  }
};
const getLayoutDataByplatform = (platform) => {
  const isPc = platform === "pc";
  if (_.isEmpty(isPc ? layout.pc : layout.mobile)) {
    if (platform === state.platform) {
      const original = _.cloneDeep(state.store);
      utils.disassemblyData2(original);
      return original;
    } else {
      const newData = _.cloneDeep(
        state.fields
          .filter((field) => !utils.checkIsInSubform(field))
          .map((e) => wrapElement(e, true, false, false, false))
      );
      utils.disassemblyData2(newData);
      return newData;
    }
  } else {
    if (platform === state.platform) {
      const original = _.cloneDeep(state.store);
      utils.disassemblyData2(original);
      layout[isPc ? "pc" : "mobile"] = original;
    }
    const layoutFields = utils
      .pickfields(isPc ? layout.pc : layout.mobile)
      .map((e) => {
        return {
          id: e,
        };
      });
    const copyData = _.cloneDeep(isPc ? layout.pc : layout.mobile);
    const addFields = _.cloneDeep(
      _.differenceBy(
        state.fields.filter((field) => !utils.checkIsInSubform(field)),
        layoutFields,
        "id"
      ).map((e) => wrapElement(e, true, false, false, false))
    );
    const delFields = _.differenceBy(layoutFields, state.fields, "id");
    utils.repairLayout(copyData, delFields);
    utils.disassemblyData2(addFields);
    copyData.push(...addFields);
    return copyData;
  }
};
const switchPlatform = (platform) => {
  if (state.platform === platform) {
    return false;
  }
  if (props.layoutType === 2) {
    syncLayout(platform, (newData) => {
      state.store = newData;
      // console.log(JSON.stringify(newData, '', 2))
      state.store.forEach((e) => {
        utils.addContext(e, state.store);
      });
    });
  }
  state.platform = platform;
};
const canvesScrollRef = ref("");
const fireEvent = (type, data) => {
  emit("listener", {
    type,
    data,
  });
};
const ns = hooks.useNamespace("Main", state.Namespace);
const getData1 = () => {
  return myEditor.getData(); //
};
const getData2 = () => {};
// setTimeout(() => {
//   let _config = JSON.parse(JSON.stringify(staticData));
//   myEditor.setData(_config); //
// }, 3000);
const getData = () => {
  return myEditor.getData();
};
const setData = (data) => {
  myEditor.setData(data);
};
defineExpose({
  form,
  switchPlatform(platform) {
    switchPlatform(platform);
  },
  setData,
  getData,
});
const handleOperation = (type, val) => {
  switch (type) {
    case 1:
      break;
    case 2:
      // state.store = []
      layout.pc = [];
      layout.mobile = [];
      state.fields.splice(0);
      state.store.splice(0);
      state.data = {};
      setSelection("root");
      break;
    case 3:
      //预览
      state.previewVisible = true;
      previewLoading.value = true;
      nextTick(() => {
        EReditorPreviewRef.value.setData(getData());
        nextTick(() => {
          previewLoading.value = false;
        });
      });
      break;
    case 4:
      fireEvent("save", getData());
      break;
    // case 5:
    //   isFoldFields.value = !isFoldFields.value;
    //   break;
    // case 6:
    //   isFoldConfig.value = !isFoldConfig.value;
    //   break;
    case 7:
      previewLoading.value = true;
      previewPlatform.value = val;
      EReditorPreviewRef.value.switchPlatform(val);
      EReditorPreviewRef.value.setData(getData());
      nextTick(() => {
        nextTick(() => {
          previewLoading.value = false;
        });
      });
      break;
  }
};
// console.log(state.selected)
watch(
  () => state.selected,
  (newVal) => {
    fireEvent("changeParams", _.cloneDeep(newVal));
  },
  {
    deep: true,
    immediate: true,
  }
);
const onClickOutside = () => {};
provide("Everright", {
  state,
  setSelection,
  props,
  wrapElement,
  delField,
  addField,
  switchPlatform,
  addFieldData,
  canvesScrollRef,
  fireEvent,
  getData,
  form,
});
</script>
<template>
  <el-container :class="[ns.b()]" direction="vertical">
    <el-container>
      <!-- <FieldsPanel v-show="isFoldFields" /> -->
      <el-container :class="[ns.e('container')]">
        <el-header :class="[ns.e('operation')]">
          <div>
            <Icon
              @click="handleOperation(4)"
              :class="[ns.e('icon')]"
              icon="save"
            ></Icon>
            <Icon
              v-if="isShowClear"
              @click="handleOperation(2)"
              :class="[ns.e('icon')]"
              icon="clear0"
            ></Icon>
            <slot name="operation-left"></slot>
          </div>
          <div>
            <DeviceSwitch
              :modelValue="state.platform"
              @update:modelValue="(val) => switchPlatform(val)"
            ></DeviceSwitch>
          </div>
          <div>
            <slot name="operation-right"></slot>
            <el-dropdown
              v-if="isShowI18n"
              @command="(command) => fireEvent('lang', command)"
            >
              <Icon :class="[ns.e('icon')]" icon="language"></Icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="zh-cn" :disabled="lang === 'zh-cn'"
                    >中文</el-dropdown-item
                  >
                  <el-dropdown-item command="en" :disabled="lang === 'en'"
                    >English</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <Icon
              @click="handleOperation(3)"
              :class="[ns.e('icon')]"
              icon="preview"
            ></Icon>
          </div>
        </el-header>
        <CanvesPanel
          v-click-outside="onClickOutside"
          v-if="isShow"
          :data="state.store"
        ></CanvesPanel>
        <!-- <Icon
          @click="handleOperation(5)"
          :class="[ns.e('arrowLeft'), !isFoldFields && ns.is('close')]"
          icon="arrowLeft"
        ></Icon>
        <Icon
          @click="handleOperation(6)"
          :class="[ns.e('arrowRight'), !isFoldConfig && ns.is('close')]"
          icon="arrowRight"
        ></Icon> -->
      </el-container>
      <!-- <ConfigPanel
        v-show="isFoldConfig"
        v-if="isShow && isShowConfig"
      ></ConfigPanel> -->
    </el-container>
  </el-container>
</template>
